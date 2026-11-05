import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {evaluate} from './match.js';
import {createJobStore} from './jobs.js';
import {createHistoryStore, HistoryInputError} from './history.js';
const store = createJobStore();
const history = createHistoryStore();
const port = Number(process.env.PORT || 3000);
http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'");
  const localHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!localHosts.includes(req.headers.host) || (req.headers.origin && !localHosts.some(host=>req.headers.origin === `http://${host}`)) || req.headers['sec-fetch-site'] === 'cross-site') {
    res.writeHead(403);res.end();return;
  }
  if (req.url === '/api/applications' && ['GET','POST'].includes(req.method)) {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    if (req.method === 'POST' && req.headers['content-type'] !== 'application/json') {res.writeHead(415);res.end(JSON.stringify({error:'Use application/json'}));return;}
    try {
      if (req.method === 'GET') {res.end(JSON.stringify({applications:await history.list()}));return;}
      let body = '';
      for await (const chunk of req) {body += chunk;if (Buffer.byteLength(body)>10000) {res.writeHead(413);res.end(JSON.stringify({error:'Registro muito grande'}));return;}}
      let input;
      try {input=JSON.parse(body);} catch {throw new HistoryInputError('JSON inválido');}
      res.end(JSON.stringify({application:await history.save(input)}));
    } catch(error) {
      res.writeHead(error instanceof HistoryInputError ? 400 : 500);
      res.end(JSON.stringify({error:error instanceof HistoryInputError ? error.message : 'Falha ao ler ou salvar o histórico. Preserve data/applications.json para recuperação.'}));
    }
    return;
  }
  if ((req.method === 'GET' && req.url === '/api/jobs') || (req.method === 'POST' && req.url === '/api/jobs/refresh')) {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    if(req.method==='POST' && req.headers['content-type']!=='application/json') {res.writeHead(415);res.end(JSON.stringify({error:'Use application/json'}));return;}
    try {
      const result = req.method === 'GET' ? await store.latest() : await store.refresh();
      res.writeHead(result?.status==='error'?502:200);
      res.end(JSON.stringify(result || {status:'not_started',jobs:[]}));
    } catch {res.writeHead(500);res.end(JSON.stringify({error:'Falha ao ler ou salvar a busca local. Tente novamente.'}));}
    return;
  }
  if (req.method === 'POST' && req.url === '/api/evaluate') {
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 100000) { res.writeHead(413); res.end(); return; } }
      const job = JSON.parse(body);
      if (!job || typeof job.title !== 'string' || !job.title.trim() || typeof job.description !== 'string') throw Error('Informe título e descrição');
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(evaluate(job)));
    } catch { res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Informe título e descrição válidos'})); }
    return;
  }
  const files = {'/':'index.html','/app.js':'app.js','/job-filters.js':'job-filters.js','/style.css':'style.css'};
  if (req.method !== 'GET' || !files[req.url]) { res.writeHead(404); res.end(); return; }
  const file = files[req.url];
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');
  res.end(await readFile(new URL(`./public/${file}`,import.meta.url)));
}).listen(port,'127.0.0.1',()=>console.log(`Jarvis Encontra iniciado na porta ${port}`));
