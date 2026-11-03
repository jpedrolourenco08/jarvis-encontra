# Jarvis Encontra no Windows

1. Instale o **Node.js LTS**, versão 22 ou superior, pelo site oficial https://nodejs.org/ . Mantenha a opção de adicionar ao PATH. Este projeto não precisa de ferramentas extras de compilação nem de pacotes npm.
2. Extraia o ZIP inteiro para uma pasta do seu usuário, por exemplo `Documentos\jarvis-encontra`. Não execute de dentro do ZIP.
3. Abra `INICIAR-JARVIS.cmd` com dois cliques. Se o Node acabou de ser instalado e não for encontrado, feche e reabra o terminal/aplicativo.
4. Espere a mensagem `Jarvis Encontra iniciado na porta 3000`.
5. Abra http://127.0.0.1:3000 no navegador desse mesmo computador.
6. Clique em **Buscar vagas na Gupy**. Aguarde a conclusão; as consultas são sequenciais e podem levar alguns minutos.

Mantenha a janela do iniciador aberta. Para encerrar, pressione Ctrl+C. Para iniciar de novo, abra o mesmo arquivo. Não precisa publicar o ambiente da nuvem.

## O que está validado

Código e testes locais no Linux; execução nativa no Windows e resposta atual da API Gupy ainda precisam de validação. Na nuvem, o proxy bloqueou a consulta antes de chegar à fonte. Rodar no Windows elimina a dependência dessa publicação, mas a Gupy ainda pode negar o acesso ou alterar o formato da API. Não há garantia de que haverá vagas compatíveis.

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
