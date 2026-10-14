@echo off
chcp 65001 >nul
title StrategyOS - Salvador (Enviar Atualizações para o GitHub)
color 0A

echo ===============================================================================
echo     STRATEGYOS 3.0 - COMPUTADOR PRINCIPAL (SALVADOR)
echo     ENVIAR ATUALIZACÕES DE CÓDIGO PARA O GITHUB
echo ===============================================================================
echo.

:: Verificar se git existe no PATH ou usar caminho padrao
where git >nul 2>nul
if %errorlevel% equ 0 (
    set GIT_CMD=git
) else (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set GIT_CMD="C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo [ERRO] O Git não foi encontrado neste computador!
        echo Instale o Git para Windows (https://git-scm.com) para continuar.
        pause
        exit /b 1
    )
)

:: Inicializar git se ainda não existir
if not exist ".git" (
    echo [INFO] Inicializando repositório Git local...
    %GIT_CMD% init
    %GIT_CMD% branch -M main
    %GIT_CMD% remote add origin https://github.com/rikelmesantana13-design/sistema-loja-.git
) else (
    %GIT_CMD% remote set-url origin https://github.com/rikelmesantana13-design/sistema-loja-.git
)

echo.
echo [1/3] Adicionando arquivos modificados...
%GIT_CMD% add -A

echo.
echo [2/3] Criando commit...
set /p MENSAGEM="Digite a descricao da atualizacao (ou aperte ENTER para automatico): "
if "%MENSAGEM%"=="" (
    set MENSAGEM=StrategyOS: Atualizacao do sistema em %date% %time%
)
%GIT_CMD% commit -m "%MENSAGEM%"

echo.
echo [3/3] Enviando para o GitHub (branch main)...
%GIT_CMD% push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo   [SUCESSO] Atualizacoes enviadas para o GitHub com sucesso!
    echo   O computador da loja (Amargosa) ja pode puxar essas atualizacoes.
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo   [AVISO] Se pediu usuario/senha do GitHub, autentique com seu token ou browser.
    echo ===============================================================================
)

echo.
pause
