# Trading ACC - Guía de Instalación Local (PC)

Esta guía te ayudará a instalar y ejecutar Trading ACC en tu propia computadora.

## Requisitos Previos
1. **Node.js**: Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/).
2. **Código Fuente**: Exporta el proyecto desde AI Studio como un archivo ZIP y descomprímelo.

## Instalación Rápida (Windows)
Simplemente haz doble clic en el archivo:
- `INICIAR_TERMINAL.bat`

Este archivo instalará automáticamente las librerías necesarias y abrirá la aplicación.

## Acceso Local
He configurado la aplicación para que **no requiera inicio de sesión con Google**. Al abrir la terminal, simplemente haz clic en "Entrar a la Terminal" y accederás con un perfil de administrador local automáticamente.

## Configuración de la IA (Importante)
Para que el análisis de IA funcione localmente:
1. Abre el archivo `.env` que se creó en la carpeta raíz.
2. Busca la línea `GEMINI_API_KEY="..."`.
3. Pega tu propia API Key de Google AI Studio (puedes obtener una gratis en [aistudio.google.com](https://aistudio.google.com/app/apikey)).

## Cómo Crear el Instalador (.exe)
Si quieres generar un archivo instalador para compartirlo o instalarlo permanentemente:
1. Abre una terminal (PowerShell) en la carpeta del proyecto.
2. Ejecuta:
   ```powershell
   npm run build:pc
   ```
3. El instalador se guardará en la carpeta `release`.
