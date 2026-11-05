@echo off
setlocal
cd /d "%~dp0"
echo Encerre o Jarvis com Ctrl+C na janela do servidor antes de continuar.
pause
where git >nul 2>nul
if errorlevel 1 goto falta_git
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 goto falta_git
git diff --quiet
if errorlevel 1 goto alteracoes
git diff --cached --quiet
if errorlevel 1 goto alteracoes
git pull --ff-only
if errorlevel 1 (
 echo Atualizacao nao concluida. Copie o erro acima; nenhum reset sera executado.
 pause
 exit /b 1
)
call TESTAR-JARVIS.cmd
if errorlevel 1 exit /b 1
echo Atualizacao validada. Abra INICIAR-JARVIS.cmd e atualize o navegador com Ctrl+F5.
exit /b 0
:falta_git
echo Este atualizador requer Git e uma pasta obtida com git clone.
echo Consulte LEIA-ME-WINDOWS.md.
pause
exit /b 1
:alteracoes
echo Existem alteracoes locais no codigo. Atualizacao interrompida para preserva-las.
echo A pasta data nao impede atualizacoes, pois e ignorada pelo Git.
pause
exit /b 1
