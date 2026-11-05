import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHistoryStore, HistoryInputError} from '../history.js';

const job = (id=1) => ({url:`https://teste.gupy.io/jobs/${id}`,title:'Assistente de Produto — teste sintético',company:'Empresa fictícia'});
async function withStore(run) {
  const folder=await mkdtemp(`${tmpdir()}/jarvis-history-`);
  const directory=pathToFileURL(`${folder}/`);
  try {await run(createHistoryStore({directory}),directory);} finally {await rm(folder,{recursive:true,force:true});}
}
test('histórico persiste, normaliza URL e atualiza sem duplicar a candidatura',async()=>withStore(async(store,directory)=>{
  assert.deepEqual(await store.list(),[]);
  const first=await store.save({job:{...job(),url:job().url+'?tracking=1#extra'},status:'pendente'});
  const updated=await store.save({job:job(),status:'erro'});
  const records=await createHistoryStore({directory}).list();
  assert.equal(records.length,1);assert.equal(records[0].status,'erro');
  assert.equal(updated.createdAt,first.createdAt);assert.equal(updated.url,job().url);
}));
test('registro manual de enviada exige confirmação explícita',async()=>withStore(async(store)=>{
  await assert.rejects(store.save({job:job(),status:'enviada_manual'}),HistoryInputError);
  assert.deepEqual(await store.list(),[]);
  const saved=await store.save({job:job(),status:'enviada_manual',confirmed:true});
  assert.match(saved.confirmation,/não verificada automaticamente/);
  assert.equal(saved.status,'enviada_manual');
}));
test('gravações concorrentes preservam todas as vagas e não duplicam URLs',async()=>withStore(async(store)=>{
  await Promise.all(Array.from({length:20},(_,id)=>store.save({job:job(id),status:'pendente'})));
  assert.equal((await store.list()).length,20);
  await Promise.all([store.save({job:job(),status:'erro'}),store.save({job:job(),status:'pendente'})]);
  assert.equal((await store.list()).length,20);
}));
test('recusa URL insegura, estado inventado e registro inválido; fila se recupera',async()=>withStore(async(store)=>{
  for(const input of [null,{}, {job:job(),status:'enviada'}, {job:{...job(),url:'https://evil.example/jobs/1'},status:'pendente'}, {job:{...job(),url:'javascript:alert(1)'},status:'pendente'}, {job:{...job(),title:'x'.repeat(301)},status:'pendente'}]) {
    await assert.rejects(store.save(input),HistoryInputError);
  }
  await store.save({job:job(),status:'pendente'});assert.equal((await store.list()).length,1);
}));
test('arquivo corrompido não é apagado nem substituído por histórico vazio',async()=>withStore(async(store,directory)=>{
  const file=new URL('applications.json',directory);
  await writeFile(file,'{"version":1,"applications": quebrado');
  const before=await readFile(file,'utf8');
  await assert.rejects(store.list());await assert.rejects(store.save({job:job(),status:'pendente'}));
  assert.equal(await readFile(file,'utf8'),before);
  await writeFile(file,JSON.stringify({version:1,applications:[{...job(),status:'inventado'}]}));
  await assert.rejects(store.list());
}));
