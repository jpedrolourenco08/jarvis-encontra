import {visibleJobs} from './job-filters.js';
const query = '"analista de produto" junior remoto';
const links = [
 ['LinkedIn',`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Analista de Produto Júnior')}&location=Brasil`],
 ['Gupy (via busca)',`https://www.google.com/search?q=${encodeURIComponent('site:gupy.io/jobs '+query)}`],
 ['Inhire (via busca)',`https://www.google.com/search?q=${encodeURIComponent('site:inhire.app '+query)}`]
];
for (const [name,url] of links) { const a=document.createElement('a'); a.textContent=name; a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; document.querySelector('#searches').append(a); }
document.querySelector('#job').addEventListener('submit',async event=>{
 event.preventDefault(); const result=document.querySelector('#result'); result.replaceChildren();
 try {
 const response=await fetch('/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});
 if(!response.ok) throw Error('Não foi possível analisar. Confira os campos e tente novamente.');
 const data=await response.json(); const h=document.createElement('h3'); h.textContent=data.status; result.append(h);
 for(const [label,items] of [['Compatibilidade',data.reasons],['Atenção',data.alerts],['Fora dos critérios',data.exclusions]]) {
 if(!items.length) continue; const heading=document.createElement('h4'); heading.textContent=label; const ul=document.createElement('ul'); for(const item of items){const li=document.createElement('li'); li.textContent=item; ul.append(li);} result.append(heading,ul);
 }
 }catch(error){result.textContent=error.message;}
});

const jobsStatus=document.querySelector('#jobs-status'), jobsList=document.querySelector('#jobs-list'), refreshButton=document.querySelector('#refresh-jobs');
const showAllJobs=document.querySelector('#show-all-jobs');
let currentJobs;
let applicationRecords = null;
const applicationLabels={pendente:'Pendente',erro:'Erro / precisa de atenção',enviada_manual:'Enviada — confirmação manual'};
showAllJobs.addEventListener('change',()=>{if(currentJobs)renderJobs(currentJobs);});
function appendText(parent,tag,content){const node=document.createElement(tag);node.textContent=content;parent.append(node);return node;}
function renderJobs(data){
 currentJobs=data;
 jobsList.replaceChildren();
 if(data.status==='not_started'){jobsStatus.textContent='Clique em buscar para consultar a Gupy.';return;}
 if(data.status==='error'){
  jobsStatus.textContent=`Busca não concluída: ${data.errors?.[0]?.message || data.error || 'fonte indisponível'}.`;
  if(data.previous){appendText(jobsList,'p','Exibindo a coleta anterior, sem atualização:');renderCards(data.previous);}
  return;
 }
 const date=new Date(data.collectedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
 jobsStatus.textContent=`${data.jobs.length} anúncio(s) para revisão · coleta em ${date} (Brasília)${data.cached?' · resultado em cache por até 15 minutos':''}. ${data.status==='partial'?'Coleta parcial; algumas buscas falharam ou atingiram o limite de páginas.':''}`;
 if(!data.jobs.length)appendText(jobsList,'p','Nenhum anúncio retornou nesta coleta limitada. Isso não significa que não existam vagas nas plataformas.');
 if(data.notice)appendText(jobsList,'p',data.notice);
 for(const error of data.errors||[])appendText(jobsList,'p',`${error.query}: ${error.message}`);
 renderCards(data);
}
function renderCards(data){
 const visible=visibleJobs(data.jobs,showAllJobs.checked);
 appendText(jobsList,'p',`${visible.length} de ${data.jobs.length} anúncio(s) exibido(s). ${showAllJobs.checked?'Todos os níveis coletados.':'Filtro: júnior, assistente, auxiliar e entrada explícitos no título. Títulos sem nível informado ficam em “Mostrar todos”.'}`);
 if(!visible.length && data.jobs.length)appendText(jobsList,'p','Nenhum título com nível de entrada explícito nesta coleta. Marque “Mostrar todos” para revisar os demais anúncios.');
 for(const job of visible){
  const article=document.createElement('article');article.className='job-card';
  appendText(article,'h3',job.title);appendText(article,'p',`${job.company} · ${job.source} · ${job.mode||'Modalidade não informada'} · ${[job.city,job.state,job.country].filter(Boolean).join(', ')||'Local não informado'}`);
  appendText(article,'p',`Salário não divulgado · Contratação: ${job.contract} · Publicação: ${job.publishedAt?new Date(job.publishedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não informada'}`);
  appendText(article,'strong',job.evaluation.status);
  for(const [label,items] of [['Compatibilidade',job.evaluation.reasons],['Atenção',job.evaluation.alerts],['Fora dos critérios',job.evaluation.exclusions]]){
   if(!items.length)continue;appendText(article,'h4',label);const ul=document.createElement('ul');for(const item of items)appendText(ul,'li',item);article.append(ul);
  }
  if(job.description){const details=document.createElement('details');appendText(details,'summary','Resumo fornecido pela fonte');appendText(details,'p',job.description);article.append(details);}
  const a=appendText(article,'a','Ver anúncio original');a.href=job.url;a.target='_blank';a.rel='noopener noreferrer';
  appendHistoryControls(article,job);
  jobsList.append(article);
 }
}
refreshButton.addEventListener('click',async()=>{
 refreshButton.disabled=true;jobsStatus.textContent='Consultando a Gupy… a busca pode levar alguns minutos.';
 try{const response=await fetch('/api/jobs/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const data=await response.json();if(data.error)throw Error(data.error);renderJobs(data);}catch(error){jobsStatus.textContent=`Não foi possível buscar vagas: ${error.message}`;}finally{refreshButton.disabled=false;}
});
function appendHistoryControls(parent,job) {
 const current=applicationRecords?.find(item=>item.url===job.url);
 const area=document.createElement('div');area.className='application-controls';
 const status=appendText(area,'p',applicationRecords===null?'Histórico indisponível. Reabra o painel para tentar novamente.':current?`No histórico: ${applicationLabels[current.status]}`:'Ainda não está no histórico');
 if(applicationRecords===null){parent.append(area);return;}
 const label=appendText(area,'label','Estado da candidatura');
 const select=document.createElement('select');
 for(const [value,title] of Object.entries(applicationLabels)){const option=appendText(select,'option',title);option.value=value;}
 select.value=current?.status||'pendente';label.append(select);
 const button=appendText(area,'button',current?'Atualizar histórico':'Salvar no histórico');button.type='button';
 button.addEventListener('click',async()=>{
  const confirmed=select.value==='enviada_manual' ? window.confirm('A plataforma confirmou que recebeu sua candidatura? Este registro é uma declaração sua; o Jarvis não verificou nem enviou a candidatura.') : false;
  if(select.value==='enviada_manual'&&!confirmed)return;
  button.disabled=true;select.disabled=true;
  try {
   const response=await fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({job:{url:job.url,title:job.title,company:job.company},status:select.value,confirmed})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível salvar o histórico');
   applicationRecords=[data.application,...applicationRecords.filter(item=>item.url!==data.application.url)];
   renderHistory();if(currentJobs)renderJobs(currentJobs);
  } catch(error){status.textContent=error.message;}finally{button.disabled=false;select.disabled=false;}
 });
 parent.append(area);
}
function renderHistory() {
 const list=document.querySelector('#history-list');list.replaceChildren();
 document.querySelector('#history-status').textContent=applicationRecords===null?'Não foi possível carregar o histórico. Reabra o painel; nenhum registro será sobrescrito.':applicationRecords.length?`${applicationRecords.length} vaga(s) registrada(s) neste computador.`:'Nenhuma vaga salva ainda. Use “Salvar no histórico” nos anúncios.';
 for(const item of applicationRecords||[]){
  const article=document.createElement('article');article.className='job-card';
  appendText(article,'h3',item.title);appendText(article,'p',item.company);
  appendText(article,'p',`Atualizado em ${new Date(item.updatedAt).toLocaleString('pt-BR')}`);
  if(item.confirmation)appendText(article,'p',item.confirmation);
  const link=appendText(article,'a','Abrir anúncio');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
  appendHistoryControls(article,item);list.append(article);
 }
}
try {
 const response=await fetch('/api/applications');if(!response.ok)throw Error();
 applicationRecords=(await response.json()).applications;
} catch {applicationRecords=null;}
renderHistory();
fetch('/api/jobs').then(response=>{if(!response.ok)throw Error();return response.json();}).then(renderJobs).catch(()=>{jobsStatus.textContent='Não foi possível carregar a coleta anterior. Tente buscar novamente.';});
