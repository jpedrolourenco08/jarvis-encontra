# Jarvis Encontra no Windows

1. Instale o **Node.js LTS**, versão 22 ou superior, pelo site oficial https://nodejs.org/ . Mantenha a opção de adicionar ao PATH. Este projeto não precisa de ferramentas extras de compilação nem de pacotes npm.
2. Extraia o ZIP inteiro para uma pasta do seu usuário, por exemplo `Documentos\jarvis-encontra`. Não execute de dentro do ZIP.
3. Abra `INICIAR-JARVIS.cmd` com dois cliques. Se o Node acabou de ser instalado e não for encontrado, feche e reabra o terminal/aplicativo.
4. Espere a mensagem `Jarvis Encontra iniciado na porta 3000`.
5. Abra http://127.0.0.1:3000 no navegador desse mesmo computador.
6. Clique em **Buscar vagas na Gupy**. Aguarde a conclusão; as consultas são sequenciais e podem levar alguns minutos.

Mantenha a janela do iniciador aberta. Para encerrar, pressione Ctrl+C. Para iniciar de novo, abra o mesmo arquivo. Não precisa publicar o ambiente da nuvem.

## O que está validado

Os 26 testes passaram no Linux cloud, e a consulta real à Gupy retornou vagas públicas. O usuário confirmou que a versão anterior abriu e retornou vagas no Windows; o histórico desta atualização ainda precisa ser exercitado nesse sistema. O painel filtra inicialmente títulos de entrada/júnior; marque **Mostrar todos** para revisar anúncios sem nível explícito ou de outros níveis. Nenhuma candidatura é preenchida ou enviada nesta versão. A Gupy pode negar o acesso ou alterar o formato da API em execuções futuras.

LinkedIn e Inhire são links de busca, sem coleta integrada. Não há agendamento ou envio de candidaturas. A última coleta válida fica em `data/jobs.json`; erros não sobrescrevem esse arquivo. A coleta tem cache de 15 minutos e limites de páginas. O servidor fica acessível somente no seu próprio computador.

## Diagnóstico

Abra o PowerShell dentro da pasta extraída e execute:

```powershell
node --version
curl.exe --version
npm.cmd test
```

Não é necessário `npm install`. O curl.exe é fornecido nas versões atuais do Windows 10/11. Se estiver ausente, consulte a documentação oficial https://curl.se/windows/ . Não desative a validação de certificados.

Se a porta 3000 estiver ocupada, use no PowerShell:

```powershell
$env:PORT = "3001"
node server.js
```

Abra então http://127.0.0.1:3001 . Se houver erro HTTP 403, erro de certificado, timeout ou formato da fonte não reconhecido, copie a mensagem do painel para diagnóstico. Não envie senhas, tokens nem arquivos de credenciais.

## Atualizar para 0.2.0 sem perder os dados

1. Encerre o Jarvis antigo com Ctrl+C na janela do iniciador.
2. Extraia o novo ZIP em uma pasta temporária.
3. Copie o conteúdo da pasta `jarvis-encontra` extraída para dentro da pasta onde você já usa o aplicativo, substituindo os arquivos de código. Não crie uma segunda pasta `jarvis-encontra` dentro da antiga.
4. **Mantenha a pasta `data` existente. Não apague nem substitua seus dados.** O pacote não contém essa pasta.
5. Abra `INICIAR-JARVIS.cmd` novamente e atualize a página com Ctrl+F5.
6. Em uma vaga, use **Salvar no histórico** com estado Pendente. Recarregue o painel e confira se o registro permanece na seção Histórico de candidaturas.

O registro “Enviada — confirmação manual” só deve ser usado se a plataforma já confirmou que recebeu sua candidatura. O Jarvis 0.2.0 não preenche nem envia formulários.

## Atualizar e testar com Git

Na pasta obtida com `git clone`, encerre o servidor e abra **ATUALIZAR-JARVIS.cmd**. Ele executa `git pull --ff-only` na branch atual e, depois, os testes. Alterações locais de código interrompem o processo; não há reset, limpeza de dados nem resolução automática de conflitos. Mantenha a branch `main` para receber versões integradas. A pasta `data` é ignorada pelo Git.

Para apenas rodar os testes, abra **TESTAR-JARVIS.cmd**. Os resultados ficam visíveis na janela; falhas não iniciam o servidor. Depois de uma atualização bem-sucedida, abra `INICIAR-JARVIS.cmd` e use Ctrl+F5 no navegador.

Na primeira atualização, antes de esses atalhos existirem na sua pasta, execute `git pull --ff-only` e `npm.cmd test` no PowerShell. Mudanças propostas por pull request só chegam à `main` após a integração. O GitHub Actions também executa os testes em Linux e Windows com Node 22 e 24; esses testes usam dados sintéticos e não consultam vagas reais nem enviam candidaturas.
