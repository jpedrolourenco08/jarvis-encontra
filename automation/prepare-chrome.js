import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {inspectPage, isGupyPage} from './inspect.js';

const input = createInterface({input:process.stdin, output:process.stdout});
let context;
try {
  const {chromium} = await import('playwright-core');
  const directory=new URL('../data/chrome-automation/',import.meta.url);
  await mkdir(directory,{recursive:true,mode:0o700});
  context=await chromium.launchPersistentContext(fileURLToPath(directory),{channel:'chrome',headless:false});
  const page=context.pages()[0] || await context.newPage();
  await page.goto('https://login.gupy.io/');
  console.log('Chrome local aberto com perfil separado. Entre na Gupy no navegador.');
  console.log('Abra uma vaga desejada e avance manualmente ate a primeira etapa da candidatura.');
  console.log('Nao envie a candidatura nesta verificacao. O Jarvis nao vai clicar nem preencher campos.');
  await input.question('Quando a etapa estiver aberta, volte aqui e pressione Enter. ');
  const pages=context.pages().filter(candidate=>isGupyPage(candidate.url()));
  if(!pages.length)throw Error('Nenhuma aba HTTPS da Gupy encontrada. Abra a candidatura nesse Chrome e tente novamente.');
  let target=pages.at(-1);
  if(pages.length>1){
    console.log('Ha mais de uma aba da Gupy. Feche as demais para identificar a candidatura sem ambiguidade.');
    await input.question('Deixe somente a aba da candidatura aberta e pressione Enter. ');
    const remaining=context.pages().filter(candidate=>isGupyPage(candidate.url()));
    if(remaining.length!==1)throw Error('Mantenha somente uma aba da Gupy e tente novamente.');
    target=remaining[0];
  }
  const report=await target.evaluate(inspectPage);
  const result={version:1,mode:'inspection_only',submissionEnabled:false,inspectedAt:new Date().toISOString(),...report};
  await writeFile(new URL('../data/chrome-diagnostic.json',import.meta.url),JSON.stringify(result,null,2),{mode:0o600});
  console.log(JSON.stringify(result,null,2));
  console.log('Conexao validada. Nenhuma candidatura enviada. Relatorio salvo em data/chrome-diagnostic.json.');
  console.log('O perfil e as sessoes ficam em data/chrome-automation. Nao compartilhe essa pasta.');
  await input.question('Pressione Enter para fechar esta sessao do Chrome. ');
} catch(error) {
  // Library errors may contain page URLs or browser logs; keep them local and
  // avoid printing browser internals, credentials or profile paths.
  console.error('Nao foi possivel concluir a preparacao do Chrome.');
  if(error.code === 'ERR_MODULE_NOT_FOUND')console.error('Execute PREPARAR-CHROME.cmd para instalar a dependencia.');
  else console.error('Confira se o Google Chrome esta instalado, feche a sessao de automacao anterior e deixe uma unica aba da Gupy aberta. Depois tente novamente.');
  process.exitCode=1;
} finally {
  input.close();
  if(context)await context.close().catch(()=>{});
}
