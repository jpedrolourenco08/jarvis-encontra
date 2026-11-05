@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto falta_node
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 goto falta_node
call npm.cmd test
if errorlevel 1 (
 echo TESTES FALHARAM. Copie a mensagem acima para diagnostico.
 pause
 exit /b 1
)
echo Todos os testes passaram.
pause
exit /b 0
:falta_node
echo Instale Node.js LTS 22 ou superior e tente novamente.
pause
exit /b 1
