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
