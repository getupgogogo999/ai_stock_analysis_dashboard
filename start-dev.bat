@echo off
title AI Stock Dashboard
cd /d %~dp0
echo.
echo Installing PyTorch ML deps (skip if already installed)...
pip install -r ml\requirements.txt -q
echo.
echo Starting Backend (auto-launches PyTorch ML) + Frontend...
echo Open http://localhost:5173
echo.
npm run dev
