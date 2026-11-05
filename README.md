# Jarvis Encontra

Assistente pessoal para transição a Produto, Projetos e Processos.

## Executar

Requer Node.js 22 ou superior e curl no PATH. Não há pacotes npm externos. O curl preserva o proxy HTTPS e a verificação TLS configurados no ambiente.

```sh
cd /workspace/jarvis-encontra
npm test
npm start
```

O servidor escuta apenas na interface local, porta 3000 (substituível com PORT). Validação local: GET / deve retornar o formulário; POST /api/evaluate recebe JSON com title, description, mode (remoto/hibrido/presencial), city, salary (mensal em BRL ou vazio) e contract (CLT/PJ).

## Escopo atual

Painel com critérios do perfil, links de busca externos, avaliação manual e um conector inicial para consulta pública à Gupy. LinkedIn e Inhire continuam apenas como links de busca. Não há autenticação, agendamento ou envio de candidaturas. A última coleta bem-sucedida é salva em `data/jobs.json` (ignorado pelo Git); telefone, e-mail e PDF não são incluídos no repositório.

### Consulta de vagas

No painel, use **Buscar vagas na Gupy**. O conector consulta `https://portal.gupy.io/api/job-search/jobs`, por nove termos de Produto, Projetos e Processos, incluindo assistentes. Consulta até duas páginas de 20 resultados por termo, elimina duplicatas por URL e remove estágios e títulos fora dessas áreas. O painel mostra inicialmente títulos com júnior, jr, assistente, auxiliar ou entrada, excluindo títulos com indicação conflitante de senioridade alta. Marque **Mostrar todos** para revisar os demais anúncios coletados, inclusive os sem senioridade explícita. Outras cidades e senioridades acima de entrada ficam sinalizadas para revisão. Resultados são ordenados por compatibilidade heurística, com senioridade alta abaixo das demais.

- `GET /api/jobs`: última coleta ou `not_started`.
- `POST /api/jobs/refresh`, com `Content-Type: application/json`: inicia coleta; reutiliza a anterior por até 15 minutos e compartilha uma consulta já em andamento.
- Falha total retorna HTTP 502 e não sobrescreve a coleta anterior; falha parcial retorna HTTP 200 com `status: partial`, erros por termo e limites atingidos.
- Salário e contrato são marcados como não informados: o conector não os deduz do texto. O resumo pode omitir graduação e experiência; é necessário abrir o anúncio original. A data da coleta não equivale à data de publicação nem confirma que a vaga continua aberta.
- O acesso à fonte envia apenas termos de busca, sem currículo, contatos ou credenciais. O conector aceita links HTTPS de anúncios em subdomínios de `gupy.io` e exibe texto sem interpretar HTML.

### Validação e pendência externa

Os 26 testes passaram no ambiente cloud, incluindo paginação no formato atual da fonte (`pagination.total`), filtro de entrada, deduplicação e preservação do cache. A consulta real à API pública da Gupy retornou HTTP 200: 17 páginas, 273 anúncios normalizados e 100 títulos de entrada identificados. Sem erros de consulta; resultado parcial pelo limite de duas páginas por termo. Números descrevem essa execução e podem mudar; não equivalem a vagas elegíveis ou garantia de contratação. Nenhuma candidatura foi enviada.

O domínio usado atualmente é `portal.gupy.io`. A política de rede atual do ambiente cloud está aplicada e permitiu a consulta; o bloqueio anterior não se reproduziu. A execução nativa no Windows ainda precisa de validação. O servidor cloud é de desenvolvimento e não constitui hospedagem permanente. Os auxiliares locais do Sites não estão disponíveis neste ambiente; nenhuma publicação foi feita nesta etapa.

A avaliação é heurística: não interpreta toda linguagem natural, não comprova elegibilidade e requer revisão humana. Salário CLT e PJ não equivale a renda líquida. Graduação completa e experiência aparecem como alertas, sem inventar qualificações. Híbrido: São Paulo capital, Franca, Ribeirão Preto, Campinas e Araraquara. Presencial: Franca, Ribeirão Preto, Campinas e Araraquara. Essas cidades são referências de alcance aproximado; outras cidades exigem avaliação do deslocamento, sem raio exato definido. Dados pessoais e currículo devem permanecer fora do repositório público.

## Próximas etapas

1. Definir execução no Windows ou hospedagem privada permanente. A coleta pública da Gupy já foi validada no cloud; outras fontes dependem de acesso permitido e validação própria.
2. Perfil local editável e integração de preenchimento assistido no Chrome. Histórico local já disponível; o envio ainda não está implementado.
3. Preenchimento assistido de candidaturas com dados confirmados e aprovação antes de cada envio. Senhas e tokens nunca devem ser enviados pelo chat ou versionados; não contornar CAPTCHA.

Utilizar o checkout existente: cada tarefa de nuvem já é isolada; não criar worktrees sem solicitação. Processos devem ser reiniciados em novas sessões.

## Windows

Consulte [LEIA-ME-WINDOWS.md](LEIA-ME-WINDOWS.md) e execute `INICIAR-JARVIS.cmd` após extrair o pacote e instalar Node.js LTS >=22. Não é necessário npm install.

## Histórico local — versão 0.2.0

Em cada anúncio, use **Salvar no histórico**. Estados disponíveis: **Pendente**, **Erro / precisa de atenção** e **Enviada — confirmação manual**. O registro de enviada exige que você confirme que a plataforma recebeu a candidatura; não constitui verificação automática. Abrir um anúncio, salvar ou mudar o estado não envia candidatura. A lista do histórico permanece disponível quando a vaga sai da coleta ou do filtro.

O histórico usa a URL normalizada do anúncio para atualizar o registro sem duplicar o mesmo link. Links diferentes para a mesma oportunidade ainda podem precisar de revisão. O estado pode ser corrigido manualmente. As gravações do mesmo processo são sequenciais e atômicas; execute apenas uma instância do Jarvis por pasta. Um arquivo corrompido gera erro e não é substituído automaticamente por uma lista vazia.

Os dados ficam em `data/applications.json`, ignorado pelo Git e ausente dos pacotes distribuídos. O armazenamento não é criptografado: permanece sujeito às permissões e cópias de segurança do seu Windows. Não compartilhe sua pasta `data`. O servidor permanece em `127.0.0.1` e recusa Host e Origin externos. Use o endereço mostrado pelo iniciador.

Validação desta versão: 26 testes passaram; rotas de histórico exercitadas por HTTP com dados sintéticos isolados. Interface nova ainda precisa de validação visual no Windows. O usuário confirmou que o painel anterior iniciou e retornou vagas no Windows. Isso valida a busca, não o preenchimento ou envio de formulários.

## Atualizar e testar com Git

Na pasta obtida com `git clone`, encerre o servidor e abra **ATUALIZAR-JARVIS.cmd**. Ele executa `git pull --ff-only` na branch atual e, depois, os testes. Alterações locais de código interrompem o processo; não há reset, limpeza de dados nem resolução automática de conflitos. Mantenha a branch `main` para receber versões integradas. A pasta `data` é ignorada pelo Git.

Para apenas rodar os testes, abra **TESTAR-JARVIS.cmd**. Os resultados ficam visíveis na janela; falhas não iniciam o servidor. Depois de uma atualização bem-sucedida, abra `INICIAR-JARVIS.cmd` e use Ctrl+F5 no navegador.

Na primeira atualização, antes de esses atalhos existirem na sua pasta, execute `git pull --ff-only` e `npm.cmd test` no PowerShell. Mudanças propostas por pull request só chegam à `main` após a integração. O GitHub Actions também executa os testes em Linux e Windows com Node 22 e 24; esses testes usam dados sintéticos e não consultam vagas reais nem enviam candidaturas.
