#!/usr/bin/env powershell
<#
.SYNOPSIS
Launch Backend - Unbound Team

.DESCRIPTION
Starts the backend server on port 3001 with development mode (auto-reload).
#>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location "$root/backend"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        🚀 UNBOUND TEAM BACKEND SERVER                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting backend server on port 3001..." -ForegroundColor Green
Write-Host "API available at: http://localhost:3001" -ForegroundColor Green
Write-Host "Health check: http://localhost:3001/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev

Pop-Location
