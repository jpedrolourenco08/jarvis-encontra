@echo off
setlocal
cd /d "%~dp0"
title Jarvis Encontra
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS em https://nodejs.org/ e abra este arquivo novamente.
  echo Se acabou de instalar, feche e abra o aplicativo ou terminal antes de tentar.
  pause
  exit /b 1
)
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo E necessario Node.js 22 ou superior. Instale a versao LTS atual.
  pause
  exit /b 1
)
where curl.exe >nul 2>nul
if errorlevel 1 (
  echo curl.exe nao encontrado. Ele acompanha versoes atuais do Windows 10 e 11.
  echo Veja o arquivo LEIA-ME-WINDOWS.md para verificar a instalacao.
  pause
  exit /b 1
)
if not defined PORT set "PORT=3000"
echo.
echo Jarvis Encontra - mantenha esta janela aberta.
echo Quando aparecer a mensagem de inicio, abra no navegador:
echo http://127.0.0.1:%PORT%
echo.
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.
node server.js
if errorlevel 1 (
  echo.
  echo O servidor encerrou com erro. Copie a mensagem acima para diagnostico.
  pause
)
