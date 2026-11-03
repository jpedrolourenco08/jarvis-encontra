import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {normalizeJob,collectJobs,createJobStore} from '../jobs.js';
// Synthetic records only; these are not real advertised positions.
const sample=(id=1,extra={})=>({id,name:'Analista de Produto Júnior',careerPageName:'Empresa de teste',jobUrl:`https://teste.gupy.io/jobs/${id}`,description:'<p>Superior cursando; Jira</p>',workplaceType:'remote',country:'Brasil',publishedDate:'2026-10-01T12:00:00Z',...extra});
test('normaliza resumo, modalidade e dados ausentes sem inventar remuneração',()=>{
 const job=normalizeJob(sample());assert.equal(job.mode,'remoto');assert.equal(job.salary,null);assert.equal(job.contract,'Não informado');assert.equal(job.description,'Superior cursando; Jira');assert.ok(job.evaluation.alerts.includes('Salário não divulgado'));assert.ok(job.evaluation.reasons.includes('Remoto no Brasil'));
});
test('recusa links inseguros e mantém data desconhecida explícita',()=>{
 for(const jobUrl of ['javascript:alert(1)','https://gupy.io.evil.com/jobs/1','https://evil.com/jobs/1','http://teste.gupy.io/jobs/1'])assert.equal(normalizeJob(sample(1,{jobUrl})),null);
 assert.equal(normalizeJob(sample(1,{publishedDate:'inválida'})).publishedAt,null);
});
test('pagina, remove duplicatas, estágios e títulos fora da área',async()=>{
 const offsets=[];
 const result=await collectJobs({queries:['Produto'],pageSize:2,fetchPage:async url=>{
 const offset=Number(new URL(url).searchParams.get('offset'));offsets.push(offset);
 return offset===0?{total:4,data:[sample(1),sample(2,{name:'Estágio em Produto'})]}:{total:4,data:[sample(1),sample(3,{name:'Vendedor'})]};
 }});
 assert.deepEqual(offsets,[0,2]);assert.equal(result.status,'ok');assert.equal(result.jobs.length,1);assert.equal(result.excluded,2);
});
test('sinaliza truncamento e falhas parciais sem esconder anúncios recebidos',async()=>{
 const result=await collectJobs({queries:['Produto','Projetos'],maxPages:1,pageSize:1,fetchPage:async url=>{if(new URL(url).searchParams.get('jobName')==='Projetos')throw Error('Fonte indisponível');return {total:10,data:[sample()]};}});
 assert.equal(result.status,'partial');assert.deepEqual(result.incompleteQueries,['Produto']);assert.equal(result.errors.length,1);assert.equal(result.jobs.length,1);
});
test('negação de rede é erro e interrompe consultas repetidas',async()=>{
 let calls=0;const result=await collectJobs({queries:['Produto','Projetos'],fetchPage:async()=>{calls++;throw Error('Acesso negado (403)');}});
 assert.equal(calls,1);assert.equal(result.status,'error');assert.equal(result.jobs.length,0);
});
test('resposta incompatível é falha de integração, não busca vazia',async()=>{
 const result=await collectJobs({queries:['Produto'],fetchPage:async()=>({unexpected:[]})});assert.equal(result.status,'error');assert.equal(result.pagesRead,0);
});
test('avisa quando a fonte não fornece requisitos ou elegibilidade remota',()=>{
 const job=normalizeJob(sample(1,{description:'',country:''}));assert.ok(job.evaluation.alerts.some(x=>x.includes('sem requisitos')));assert.ok(job.evaluation.alerts.some(x=>x.includes('residentes no Brasil')));
});
test('salva coleta, reutiliza cache e preserva última coleta quando a fonte falha',async()=>{
 const dir=await mkdtemp(`${tmpdir()}/jarvis-jobs-`);let clock=Date.parse('2026-10-01T00:00:00Z'),calls=0,fail=false;
 const directory=pathToFileURL(`${dir}/`);
 const store=createJobStore({directory,now:()=>clock,collect:async()=>{calls++;return {status:fail?'error':'ok',collectedAt:new Date(clock).toISOString(),jobs:fail?[]:[normalizeJob(sample())]};}});
 try{
 assert.equal(await store.latest(),null);await store.refresh();assert.equal((await store.latest()).jobs.length,1);
 assert.equal((await store.refresh()).cached,true);assert.equal(calls,1);
 clock+=16*60*1000;fail=true;const result=await store.refresh();assert.equal(result.status,'error');assert.equal(result.previous.jobs.length,1);assert.equal((await store.latest()).jobs.length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
