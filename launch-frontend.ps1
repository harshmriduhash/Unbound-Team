#!/usr/bin/env powershell
<#
.SYNOPSIS
Launch Frontend - Unbound Team

.DESCRIPTION
Starts the frontend development server on port 5173.
Vite dev server with hot module replacement enabled.
#>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location "$root/frontend"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        🎨 UNBOUND TEAM FRONTEND (REACT)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting frontend server on port 5173..." -ForegroundColor Green
Write-Host "Application available at: http://localhost:5173" -ForegroundColor Green
Write-Host "Hot reload enabled" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev

Pop-Location
