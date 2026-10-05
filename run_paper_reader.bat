@echo off
title PaperMind - Minimalist Academic Paper Reader
echo ===================================================================
echo               Starting PaperMind Local AI Paper Reader
echo ===================================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not detected on your Windows system.
    echo Please install Node.js (LTS version) from: https://nodejs.org/
    echo Once installed, double click this script again.
    echo.
    pause
    exit /b 1
)

:: 2. Check and install dependencies if node_modules is missing
if not exist node_modules (
    echo [SETUP] First-time launch detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

:: 3. Launch the web app
echo [READY] Launching PaperMind server on http://localhost:3000...
start "" http://localhost:3000

:: 4. Start development server
call npm run dev

pause
