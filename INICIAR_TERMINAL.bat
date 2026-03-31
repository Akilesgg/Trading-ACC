@echo off
title Iniciando Trading ACC Terminal
echo ====================================================
echo   BIENVENIDO A TRADING ACC TERMINAL
echo ====================================================
echo.
echo Verificando instalacion...
echo.

if not exist .env (
    echo Creando archivo de configuracion .env...
    copy .env.example .env
    echo.
    echo [IMPORTANTE] Por favor, abre el archivo .env y añade tu GEMINI_API_KEY.
    echo.
)

if not exist node_modules (
    echo Instalando librerias necesarias (esto solo tardara un momento la primera vez)...
    call npm install
)

echo.
echo Iniciando aplicacion en modo escritorio...
echo.
call npm run electron:dev

pause
