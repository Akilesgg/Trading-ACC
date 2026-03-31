# Trading ACC - Local Setup Script
# This script automates the installation and build process for PC.

Write-Host "--- TRADING ACC: TERMINAL SETUP ---" -ForegroundColor Cyan

# 1. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install it from https://nodejs.org/" -ForegroundColor Red
    exit
}

# 2. Install dependencies
Write-Host "Installing dependencies... (This may take a minute)" -ForegroundColor Yellow
npm install

# 3. Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "IMPORTANT: Please open the .env file and add your GEMINI_API_KEY." -ForegroundColor Green
}

# 4. Build the application
Write-Host "Building the application..." -ForegroundColor Yellow
npm run build

# 5. Ask user if they want to run or package
$choice = Read-Host "Setup complete! Do you want to (1) Run the app now or (2) Package it for PC? (Enter 1 or 2)"

if ($choice -eq "1") {
    Write-Host "Starting Kinetic Edge..." -ForegroundColor Cyan
    npm run electron:dev
} elseif ($choice -eq "2") {
    Write-Host "Packaging for PC... (Check the 'release' folder when finished)" -ForegroundColor Cyan
    npm run electron:build
} else {
    Write-Host "Done! You can run 'npm run electron:dev' later to start the app." -ForegroundColor Green
}
