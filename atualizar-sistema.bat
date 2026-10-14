@echo off
chcp 65001 >nul
title StrategyOS - Puxar Atualizações do GitHub
color 0B

echo ===============================================================================
echo     STRATEGYOS 3.0 - ATUALIZAR SISTEMA A PARTIR DO GITHUB
echo ===============================================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git não encontrado! Verifique se o Git está instalado.
    pause
    exit /b 1
)

echo Puxando as ultimas modificacoes feitas no computador principal (Salvador)...
git pull origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo   [SUCESSO] Sistema atualizado com sucesso!
    echo   Basta reiniciar o sistema ou dar F5 no navegador para ver as melhorias.
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo   [AVISO] Nao foi possivel atualizar automaticamente.
    echo   Verifique sua conexao de internet ou se o repositorio remoto esta correto.
    echo ===============================================================================
)

echo.
pause
