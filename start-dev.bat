@echo off
title AI Stock Dashboard - Dev
echo.
echo [1/3] Starting PyTorch ML service on :8000 ...
start "ML Service" cmd /k "cd /d %~dp0ml && pip install -r requirements.txt -q && python -m uvicorn app:app --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul
echo [2/3] Starting backend on :3001 ...
start "Backend" cmd /k "cd /d %~dp0 && npm run dev:server"
timeout /t 2 /nobreak >nul
echo [3/3] Starting frontend on :5173 ...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev:client"
echo.
echo Open http://localhost:5173
echo Demo flow: 获取行情 -^> ML 预测 -^> AI 分析
pause
