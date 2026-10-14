@echo off
chcp 65001 >nul
title StrategyOS - Cesinha Acessórios (Amargosa)
color 0B

echo ===============================================================================
echo     🏪 STRATEGYOS 3.0 - INICIAR SISTEMA DA LOJA (AMARGOSA)
echo ===============================================================================
echo.

:: 1. Tentar puxar atualizações do GitHub (se Git estiver instalado e configurado)
where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist ".git" (
        echo [1/3] Verificando se ha novas atualizacoes de Salvador no GitHub...
        git fetch origin main >nul 2>nul
        git pull origin main --no-edit >nul 2>nul
        if %errorlevel% equ 0 (
            echo   -> Sistema atualizado com a versao mais recente!
        ) else (
            echo   -> Sem conexao ou sistema ja atualizado. Continuando...
        )
    )
)

:: 2. Iniciar servidor local na porta 8080 se nao estiver rodando
echo [2/3] Verificando servidor local na porta 8080...
netstat -ano | findstr :8080 >nul 2>nul
if %errorlevel% neq 0 (
    echo   -> Iniciando servidor local em segundo plano...
    start /min powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0server.ps1"
    timeout /t 2 >nul
) else (
    echo   -> Servidor local ja esta ativo!
)

:: 3. Abrir o Google Chrome no modo Aplicativo
echo [3/3] Abrindo StrategyOS no modo Loja...

set CHROME_PATH=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if not %CHROME_PATH%=="" (
    start "" %CHROME_PATH% --app="http://localhost:8080/cesinha-vendedor.html" --user-data-dir="%LOCALAPPDATA%\StrategyOS_ChromeProfile"
) else (
    start http://localhost:8080/cesinha-vendedor.html
)

echo.
echo ===============================================================================
echo     ✅ SISTEMA INICIADO COM SUCESSO!
echo     Esta janela pode ser minimizada. Bom trabalho e boas vendas!
echo ===============================================================================
timeout /t 4 >nul
exit
