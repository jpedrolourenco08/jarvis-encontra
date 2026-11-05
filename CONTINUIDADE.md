# Continuidade do Jarvis Encontra

## Objetivo
Assistente para Windows e Google Chrome que encontre vagas e reduza o preenchimento repetitivo de candidaturas. Primeira integração existente: busca pública na Gupy; LinkedIn e InHire apenas como links externos.

## Estado importado
Código recuperado da instalação local, sem dados coletados, backups ou documentos pessoais. A interface oferece busca de vagas e avaliação manual. Ainda não há perfil editável, anexação de currículo, histórico de candidaturas ou preenchimento/envio de formulários. O filtro inicial de títulos de entrada mencionado no chat anterior ainda não foi aplicado.

Validação no Windows durante a recuperação: 16 de 17 testes passaram; um falhou com EPERM ao renomear o arquivo temporário do cache. Investigar e reproduzir antes de concluir que é falha do aplicativo. A consulta real à Gupy não foi revalidada nesta recuperação. A pasta local do usuário não foi alterada.

## Plano curto
1. Confirmar execução e coleta real; aplicar filtro inicial para júnior, assistente, auxiliar e entrada, com opção de mostrar todos os anúncios coletados.
2. Perfil e preferências editáveis, currículo selecionado no computador, respostas confirmadas e armazenamento privado local.
3. Histórico de candidaturas por vaga, evitando duplicatas e distinguindo pendente, erro e enviada.
4. Avaliar a integração permitida com formulários da Gupy no Chrome local; implementar preenchimento assistido com dados confirmados.
5. Oferecer revisão antes do envio ou envio automático quando permitido e completo. Marcar enviada somente após confirmação da plataforma.

## Requisitos preservados
- Produto, Projetos e Processos em nível de entrada/júnior, incluindo PO e PM.
- Remoto no Brasil; híbrido em São Paulo, Ribeirão Preto e proximidades de Franca; presencial em Franca e região. O código atual contém uma lista mais ampla de cidades: confirmar preferências antes de alterar.
- Remuneração a partir de R$ 3.500 mensais; incluir salário não informado com aviso.
- Sinalizar graduação concluída e outros requisitos que exijam revisão.
- Não inventar formação, experiência, competências ou respostas. Campos desconhecidos ficam pendentes.
- Interromper para perguntas específicas, testes, CAPTCHA e verificações que exijam participação do usuário. Respeitar regras e limites das plataformas.
- Não publicar contatos, currículo, credenciais, sessões do navegador ou respostas pessoais no GitHub. O perfil detalhado foi fornecido no chat e não acompanha este documento.

## Arquitetura proposta
Manter painel e servidor Node.js; adicionar armazenamento local privado para perfil e histórico; separar conectores de busca da automação de candidaturas no navegador local. O ambiente cloud serve para desenvolvimento e testes; acesso ao Chrome e arquivos pessoais do Windows deve ser tratado como uma integração separada.

## Validação e avanço no cloud — 4 de novembro de 2026 (Brasília)
- Ambiente confirmado pelo runtime como cloud, running e connected, com política de rede aplicada.
- Checkout isolado na branch local `work`, partindo do mesmo commit da `main` remota: `70d24ece793b1976356b409f76cc245afc5e34c3`.
- Corrigida leitura de `pagination.total` e mensagem de erro para o domínio real `portal.gupy.io`.
- Consulta pública real: HTTP 200; coleta de 17 páginas, 273 anúncios, 100 títulos de entrada; sem erros, parcial por limites de páginas. Dados variam por execução e não comprovam elegibilidade.
- Aplicado filtro inicial de títulos explícitos de entrada/júnior e opção de mostrar todos, preservando a coleta original. Títulos sem nível informado não são presumidos júnior.
- 21 testes passaram, incluindo cache e novos casos de filtro/paginação.
- Não há integração de preenchimento ou envio de candidaturas nesta versão. Nenhuma candidatura enviada e nenhum dado pessoal publicado.
- Publicação permanente ainda pendente: os scripts auxiliares do plugin Sites não estão instalados no executor nem acessíveis pelos recursos consultados. Não foi criado Site nem alterada sua audiência. O servidor local de desenvolvimento não equivale a serviço permanente.
- Próximo passo: definir uso no Windows junto do Chrome ou hospedagem online privada; depois implementar histórico e integração de candidaturas, com dados confirmados e sem presumir acesso ao navegador do Windows a partir do cloud.

## Continuação — execução no Windows e histórico 0.2.0
- Usuário escolheu execução no próprio Windows, junto do Chrome, e confirmou que o painel iniciou e retornou vagas. Hospedagem online deixa de ser objetivo imediato.
- Implementado histórico em `data/applications.json`, fora do Git e dos pacotes, com pendente, erro e enviada por confirmação manual explícita. Nenhum envio automático implementado.
- URLs normalizadas deduplicam o mesmo anúncio; salvar e abrir anúncios não registram envio. Identidades diferentes da mesma vaga ainda exigem revisão.
- Gravações atômicas e sequenciais no mesmo processo, com falha explícita para arquivo corrompido; manter somente uma instância por pasta.
- Adicionadas verificações de Host/Origin locais, limite de corpo e bloqueio de cache HTTP para histórico.
- 26 testes passaram; HTTP validado com registros sintéticos isolados (200 para painel e histórico; 400 para enviada sem confirmação; 403 para Host/Origin externos; 413 para corpo excedido). Validação visual do histórico no Windows pendente.
- Próximo trabalho: perfil local com respostas confirmadas e currículo selecionado no Windows; depois avaliar integração permitida com Chrome/Gupy. Não existe conexão automática do cloud com o Chrome do usuário.

## Atualizações pelo Git
- Usuário confirmou que conseguiu configurar a execução pelo Git no Windows.
- Adicionados ATUALIZAR-JARVIS.cmd (pull fast-forward e testes) e TESTAR-JARVIS.cmd. Nenhum reset, limpeza de dados ou instalação de dependências é necessário.
- Adicionado workflow de testes Linux/Windows em Node 22/24, sem consultas reais ou envio de candidaturas.
- Alterações devem ser disponibilizadas em pull request para main; o usuário recebe a atualização na main após integração.

## Preparação local para envio automático — 5 de novembro de 2026
- Usuário solicitou envio automático, confirmou cadastro/currículo prontos na Gupy e autorizou acesso ao Chrome quando necessário. A autorização não estabelece conexão técnica entre cloud e Windows.
- PR anterior integrado na main (7efb16d); trabalho atual parte desse commit.
- Adicionado PREPARAR-CHROME.cmd e script com playwright-core fixado em 1.64.1. Abre perfil Chrome separado em data/chrome-automation e aguarda login/navegação manuais. Nenhuma depuração remota exposta pelo aplicativo.
- Inspeção coleta somente contagens de controles e nomes de ações conhecidos, sem valores, HTML, perguntas, cookies ou screenshots. Saída local data/chrome-diagnostic.json. Nenhuma submissão habilitada ou implementada.
- 27 testes passaram e inspeção foi exercitada no Chromium Linux com formulário sintético, verificando ausência de valores no relatório e ausência de submissão. Chrome/Windows e formulários autenticados reais continuam pendentes.
- Próximo passo depende de execução local do preparador e descrição da etapa/relatório sem dados pessoais. Não inventar seletores de submissão nem registrar enviada sem confirmação real da plataforma.
