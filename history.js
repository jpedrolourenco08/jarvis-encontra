import {readFile, mkdir, writeFile, rename, rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {normalizeJob} from './jobs.js';

export class HistoryInputError extends Error {}
export const historyStates = ['pendente', 'erro', 'enviada_manual'];

function snapshot(job) {
  if (!job || typeof job.url !== 'string' || job.url.length > 2048 || typeof job.title !== 'string' || !job.title.trim() || job.title.length > 300 || typeof job.company !== 'string' || job.company.length > 300) {
    throw new HistoryInputError('Vaga inválida para o histórico');
  }
  const clean = normalizeJob({id:'history', name:job.title, careerPageName:job.company, jobUrl:job.url});
  if (!clean) throw new HistoryInputError('Use um link HTTPS de anúncio da Gupy');
  return {url:clean.url, title:clean.title, company:clean.company};
}

export function createHistoryStore({directory=new URL('./data/', import.meta.url), now=()=>new Date()}={}) {
  const file = new URL('applications.json', directory);
  let queue = Promise.resolve();
  async function list() {
    let body;
    try {body = await readFile(file, 'utf8');} catch (error) {if (error.code === 'ENOENT') return []; throw error;}
    const data = JSON.parse(body);
    if (data?.version !== 1 || !Array.isArray(data.applications) || data.applications.some(item => {
      try {return snapshot(item).url !== item.url || !historyStates.includes(item.status) || !Number.isFinite(Date.parse(item.updatedAt)) || !Number.isFinite(Date.parse(item.createdAt));} catch {return true;}
    })) throw Error('Histórico local inválido; preserve o arquivo para recuperação');
    return data.applications;
  }
  function save(input) {
    const task = queue.then(async () => {
      const job = snapshot(input?.job);
      if (!historyStates.includes(input.status)) throw new HistoryInputError('Estado de candidatura inválido');
      if (input.status === 'enviada_manual' && input.confirmed !== true) throw new HistoryInputError('Confirme o recebimento pela plataforma antes de registrar o envio manual');
      const applications = await list();
      const previous = applications.find(item => item.url === job.url);
      const timestamp = now().toISOString();
      const record = {...job, status:input.status, createdAt:previous?.createdAt || timestamp, updatedAt:timestamp};
      if (record.status === 'enviada_manual') record.confirmation = 'Declarada pelo usuário; não verificada automaticamente';
      const next = [record, ...applications.filter(item => item.url !== job.url)];
      await mkdir(directory, {recursive:true, mode:0o700});
      const temp = new URL(`applications.${randomUUID()}.tmp`, directory);
      try {
        await writeFile(temp, JSON.stringify({version:1, applications:next}, null, 2), {mode:0o600, flag:'wx'});
        await rename(temp, file);
      } finally {await rm(temp, {force:true});}
      return record;
    });
    queue = task.catch(() => {});
    return task;
  }
  return {list, save};
}
