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

No painel, use **Buscar vagas na Gupy**. O conector consulta `https://portal.api.gupy.io/api/v1/jobs`, por nove termos de Produto, Projetos e Processos, incluindo assistentes. Consulta até duas páginas de 20 resultados por termo, elimina duplicatas por URL e remove estágios e títulos fora dessas áreas. Outras cidades e senioridades acima de entrada ficam sinalizadas para revisão. Resultados são ordenados por compatibilidade heurística, com senioridade alta abaixo das demais.

- `GET /api/jobs`: última coleta ou `not_started`.
- `POST /api/jobs/refresh`, com `Content-Type: application/json`: inicia coleta; reutiliza a anterior por até 15 minutos e compartilha uma consulta já em andamento.
- Falha total retorna HTTP 502 e não sobrescreve a coleta anterior; falha parcial retorna HTTP 200 com `status: partial`, erros por termo e limites atingidos.
- Salário e contrato são marcados como não informados: o conector não os deduz do texto. O resumo pode omitir graduação e experiência; é necessário abrir o anúncio original. A data da coleta não equivale à data de publicação nem confirma que a vaga continua aberta.
- O acesso à fonte envia apenas termos de busca, sem currículo, contatos ou credenciais. O conector aceita links HTTPS de anúncios em subdomínios de `gupy.io` e exibe texto sem interpretar HTML.

### Validação e pendência externa

Os 17 testes locais passaram, incluindo paginação, deduplicação, falhas parciais, links inseguros e preservação do cache, com respostas sintéticas explicitamente identificadas. O painel e a rota real de consulta foram exercitados por HTTP. **A resposta atual da API pública ainda não foi validada**: o proxy da plataforma negou o domínio com HTTP 403 antes do acesso à Gupy.

A liberação de `portal.api.gupy.io` foi salva no rascunho das configurações de rede. Revise e salve as configurações do ambiente, publique conforme solicitado pela interface e então refaça a consulta. Se a API mudar o formato, o conector deve reportar falha em vez de interpretar a resposta como ausência de vagas. Não contornar bloqueios, autenticação ou CAPTCHA.

A avaliação é heurística: não interpreta toda linguagem natural, não comprova elegibilidade e requer revisão humana. Salário CLT e PJ não equivale a renda líquida. Graduação completa e experiência aparecem como alertas, sem inventar qualificações. Híbrido: São Paulo capital, Franca, Ribeirão Preto, Campinas e Araraquara. Presencial: Franca, Ribeirão Preto, Campinas e Araraquara. Essas cidades são referências de alcance aproximado; outras cidades exigem avaliação do deslocamento, sem raio exato definido. Dados pessoais e currículo devem permanecer fora do repositório público.

## Próximas etapas

1. Aplicar a liberação de rede e validar o formato e o comportamento real da API da Gupy; só então ampliar para outras fontes públicas com acesso permitido.
2. Histórico privado das vagas e revisão dos requisitos.
3. Preenchimento assistido de candidaturas com dados confirmados e aprovação antes de cada envio. Senhas e tokens nunca devem ser enviados pelo chat ou versionados; não contornar CAPTCHA.

Utilizar o checkout existente: cada tarefa de nuvem já é isolada; não criar worktrees sem solicitação. Processos devem ser reiniciados em novas sessões.

## Windows

Consulte [LEIA-ME-WINDOWS.md](LEIA-ME-WINDOWS.md) e execute `INICIAR-JARVIS.cmd` após extrair o pacote e instalar Node.js LTS >=22. Não é necessário npm install.
