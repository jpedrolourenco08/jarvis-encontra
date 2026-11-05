import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {evaluate} from './match.js';
const exec = promisify(execFile);
const normalize = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const terms = ['Product Owner','Product Manager','Analista de Produto','Analista de Projetos','Analista de Processos','Product Operations','Assistente de Produto','Assistente de Projetos','Assistente de Processos'];
const text = value => typeof value === 'string' ? value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim() : '';
export function normalizeJob(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id || !text(raw.name)) return null;
  let url;
  try { url = new URL(raw.jobUrl); } catch { return null; }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.gupy.io') || url.username || url.password || !/^\/(?:jobs\/\d+|job\/[A-Za-z0-9_%=+.-]+)\/?$/.test(url.pathname)) return null;
  url.search=''; url.hash='';
  const work = normalize(raw.workplaceType);
  const mode = /remote|remoto/.test(work) || raw.isRemote === true ? 'remoto' : /hybrid|hibrido/.test(work) ? 'hibrido' : /on.?site|presencial/.test(work) ? 'presencial' : '';
  // Employment type and remuneration are not inferred from missing or ambiguous fields.
  const job = {id:String(raw.id),source:'Gupy',title:text(raw.name),company:text(raw.careerPageName)||'Empresa não informada',description:text(raw.description),city:text(raw.city),state:text(raw.state),country:text(raw.country),mode,salary:null,contract:'Não informado',url:url.href,publishedAt:typeof raw.publishedDate === 'string' && Number.isFinite(Date.parse(raw.publishedDate)) ? new Date(raw.publishedDate).toISOString() : null};
  const city = mode === 'remoto' ? /^(br|brasil|brazil)$/i.test(job.country) ? 'Brasil' : job.country : job.city;
  job.evaluation = evaluate({...job,city});
  if (!job.description) job.evaluation.alerts.push('Resumo da fonte sem requisitos: leia o anúncio completo antes de avaliar graduação e experiência');
  return job;
}
export async function fetchGupy(url) {
  // curl honors the platform HTTPS proxy and CA trust. No shell, cookies or credentials.
  try {
    const {stdout} = await exec('curl',['--fail-with-body','--silent','--show-error','--proto','=https','--connect-timeout','10','--max-time','20','--max-filesize','5000000',url],{maxBuffer:6_000_000,timeout:25000});
    const payload = JSON.parse(stdout);
    if (!payload || !Array.isArray(payload.data)) throw Error('Resposta da Gupy em formato não reconhecido');
    return payload;
  } catch (error) {
    if (/403|CONNECT tunnel failed/.test(String(error.stderr))) throw Error('Acesso à Gupy negado (403). Confira o acesso a portal.gupy.io nas configurações de rede');
    if (error instanceof SyntaxError) throw Error('A Gupy não retornou JSON válido');
    if (error.code || error.killed) throw Error('Não foi possível consultar a Gupy: rede, tempo limite ou resposta HTTP. Tente novamente após verificar a conexão');
    throw error;
  }
}
export async function collectJobs({fetchPage=fetchGupy,queries=terms,maxPages=2,pageSize=20,now=()=>new Date()}={}) {
  const byUrl = new Map(), errors = [], incompleteQueries = [];
  let pagesRead=0, discarded=0, excluded=0;
  for (const query of queries) {
    for (let page=0;page<maxPages;page++) {
      const url = new URL('https://portal.gupy.io/api/job-search/jobs');
      url.search = new URLSearchParams({jobName:query,limit:String(pageSize),offset:String(page*pageSize)});
      let payload;
      try {
        payload = await fetchPage(url.href);
        if (!Array.isArray(payload?.data)) throw Error('Formato de resposta da fonte não reconhecido');
      } catch(error) { errors.push({query,message:error.message}); break; }
      pagesRead++;
      for (const raw of payload.data) {
        const job=normalizeJob(raw);
        if (!job) {discarded++;continue;}
        const title=normalize(job.title);
        if (!/product owner|product manager|product operations|product ops|\bpo\b|\bpm\b|produto|projetos|processos/.test(title) || /estagi|internship/.test(title)) {excluded++;continue;}
        byUrl.set(job.url,job);
      }
      const total = Number.isFinite(payload.pagination?.total) ? payload.pagination.total : Number.isFinite(payload.total) ? payload.total : null;
      if (payload.data.length < pageSize || (total !== null && (page+1)*pageSize >= total)) break;
      if (page===maxPages-1) incompleteQueries.push(query);
    }
    // A policy denial applies to every query: do not repeat the same failed request.
    if (pagesRead===0 && errors.some(error=>error.message.includes('403'))) break;
  }
  const jobs = [...byUrl.values()].sort((a,b)=>{
    const rank = job => (job.evaluation.status==='Prioritária'?100:0) + job.evaluation.reasons.length*5 - job.evaluation.alerts.length*2 - (/senior|\bsr\b|pleno|gerente|head|diretor|coordenador/.test(normalize(job.title))?50:0);
    return rank(b)-rank(a) || (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0);
  });
  return {source:'Gupy',collectedAt:now().toISOString(),status:!pagesRead?'error':errors.length||incompleteQueries.length?'partial':'ok',pagesRead,discarded,excluded,incompleteQueries,errors,jobs,notice:'Coleta limitada a até duas páginas por termo. Não cobre todas as vagas. Resumos podem omitir requisitos, salário e contrato; confirme no anúncio original. Integração pública sem garantia de estabilidade.'};
}
export function createJobStore({directory=new URL('./data/',import.meta.url),collect=collectJobs,now=()=>Date.now(),ttl=15*60*1000}={}) {
  const file = new URL('jobs.json',directory);
  let running;
  async function latest() { try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;} }
  async function refresh() {
    if(running)return running;
    running=(async()=>{
      const previous=await latest();
      if(previous && now()-Date.parse(previous.collectedAt)<ttl)return {...previous,cached:true};
      const result=await collect();
      if(result.status==='error')return {...result,previous};
      await mkdir(directory,{recursive:true});
      const temp = new URL('jobs.json.tmp',directory);
      await writeFile(temp,JSON.stringify(result,null,2)); await rename(temp,file);
      return result;
    })();
    try{return await running;}finally{running=null;}
  }
  return {latest,refresh};
}
