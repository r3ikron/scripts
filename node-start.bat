@echo off

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js could not be found. Please install Node.js.
    exit /b 1
)

where ng >nul 2>nul
if %errorlevel% neq 0 (
    echo Angular CLI could not be found. Please install Angular CLI.
    exit /b 1
)

if "%1"=="" (
    echo Usage: node-start ^<PROJECT^>
    echo Project setup.
    exit /b 1
)

node "%~dp0node-start.js" %1