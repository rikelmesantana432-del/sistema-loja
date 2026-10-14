@echo off
echo ===================================================
echo   Enviando o StrategyOS para o seu GitHub...
echo ===================================================
echo.
"C:\Program Files\Git\cmd\git.exe" remote set-url origin https://github.com/rikelmesantana13-design/sistema-loja-.git
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "StrategyOS: Atualizacao do sistema"
"C:\Program Files\Git\cmd\git.exe" push origin main
echo.
echo ===================================================
echo   Processo concluido com sucesso!
echo ===================================================
pause

