@echo off
REM Pull the latest changes, then start the backend via run.bat.
git pull
if errorlevel 1 (
    echo.
    echo git pull failed - fix the issue above, then run again.
    exit /b 1
)
call run.bat
