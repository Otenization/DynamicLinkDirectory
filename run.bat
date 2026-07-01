@echo off
REM Install dependencies, build the frontend (outputs to Backend/public/dist),
REM then start the backend which serves the API + the built frontend.

echo [1/4] Installing backend dependencies...
call npm --prefix Backend install
if errorlevel 1 (
    echo Backend install failed.
    exit /b 1
)

echo [2/4] Installing frontend dependencies...
call npm --prefix Frontend install
if errorlevel 1 (
    echo Frontend install failed.
    exit /b 1
)

echo [3/4] Building frontend...
call npm --prefix Frontend run build
if errorlevel 1 (
    echo Frontend build failed.
    exit /b 1
)

echo [4/4] Starting backend...
call npm --prefix Backend start
