@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js / npm not found. Please install Node.js 20+ first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

if not exist "dist" (
  echo Building production bundle...
  call npm run build
  if errorlevel 1 goto :error
)

echo.
echo PPTist is starting at http://127.0.0.1:4173/
echo Press Ctrl+C to stop.
echo.
start "" "http://127.0.0.1:4173/"
call npm run preview -- --host 0.0.0.0 --port 4173
exit /b 0

:error
echo.
echo Failed to start. Check the messages above.
pause
exit /b 1
