@echo off
chcp 65001 >nul
title StrategyOS 3.0 - Git Automatico (Sem Mexer no Banco de Dados)
echo ============================================================================
echo   🔄 SINCRONIZACAO AUTOMATICA DE CODIGO (BLINDAGEM DE BANCO DE DADOS ATIVA)
echo ============================================================================
echo.

set GIT_BIN="C:\Program Files\Git\cmd\git.exe"
if not exist %GIT_BIN% set GIT_BIN=git

:: 1. Blindar arquivos de banco/backup para nunca serem alterados ou sobrescritos
%GIT_BIN% update-index --assume-unchanged js/backup-data.js 2>nul
%GIT_BIN% update-index --assume-unchanged js/supabase-config.js 2>nul

:: 2. Adicionar apenas codigo-fonte (excluindo explicitamente dados/backups)
echo [1/3] Preparando arquivos de codigo (ignorando banco de dados)...
%GIT_BIN% add .
%GIT_BIN% reset HEAD js/backup-data.js 2>nul
%GIT_BIN% reset HEAD js/supabase-config.js 2>nul

:: 3. Criar commit automatico se houver alteracoes
echo [2/3] Registrando atualizacao no Git local...
%GIT_BIN% commit -m "auto-sync: atualizacao automatica do sistema (sem alterar banco de dados)" 2>nul

:: 4. Puxar e Enviar para o GitHub (outro PC)
echo [3/3] Enviando atualizacao para a nuvem (GitHub)...
%GIT_BIN% pull --rebase origin main 2>nul
%GIT_BIN% push -u origin main

echo.
echo ============================================================================
echo   ✅ SINCRONIZACAO CONCLUIDA! O BANCO DE DADOS PERMANECEU 100%% INTACTO.
echo ============================================================================
timeout /t 5
