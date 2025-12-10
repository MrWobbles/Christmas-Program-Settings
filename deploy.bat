@echo off
REM Deploy script for Christmas Program Settings
REM Syncs only changed files to Dreamhost using rsync or scp

setlocal enabledelayedexpansion

REM Try common Git Bash installation paths
set "GIT_BASH="

if exist "C:\Program Files\Git\bin\bash.exe" (
    set "GIT_BASH=C:\Program Files\Git\bin\bash.exe"
) else if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    set "GIT_BASH=C:\Program Files (x86)\Git\bin\bash.exe"
) else (
    echo Git Bash not found. Please install Git for Windows or update the path in deploy.bat
    pause
    exit /b 1
)

REM Launch Git Bash and run the deploy script
REM -i: interactive mode
REM -c: run command
REM exec bash: keeps terminal open after script completes
start "" "!GIT_BASH!" -i -c "cd '%CD%' && bash ./deploy.sh; exec bash"

endlocal
