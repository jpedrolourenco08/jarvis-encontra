@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto falta_node
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 goto falta_node
echo Instalando dependencia de automacao. O Chrome deve estar instalado no Windows.
call npm.cmd ci --ignore-scripts
if errorlevel 1 (
 echo Instalacao falhou. Confira a conexao e tente novamente.
 pause
 exit /b 1
)
node automation/prepare-chrome.js
if errorlevel 1 (
 echo Preparacao incompleta. Nenhuma candidatura foi enviada pelo Jarvis.
 pause
 exit /b 1
)
pause
exit /b 0
:falta_node
echo Instale Node.js LTS 22 ou superior e tente novamente.
pause
exit /b 1
