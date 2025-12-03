#!/usr/bin/env powershell
<#
.SYNOPSIS
Quick Start Script - Unbound Team MVP Setup & Launch

.DESCRIPTION
Sets up and launches the complete Unbound Team SaaS MVP (backend + frontend).
Guides through environment setup and starts both services with proper configuration.

.PARAMETER Skip
Skip specific steps (comma-separated): prerequisites, backend, frontend, all

.EXAMPLE
.\start.ps1
.\start.ps1 -Skip backend
#>

param(
    [string[]]$Skip = @()
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Text.PadRight(50)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text, [string]$Status = "⏳")
    Write-Host "$Status  $Text" -ForegroundColor $colors.Info
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor $colors.Success
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor $colors.Error
}

# 1. Check Prerequisites
Write-Header "CHECKING PREREQUISITES"

Write-Step "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    $nodeMajor = [int]$nodeVersion.Split('.')[0].TrimStart('v')
    
    if ($nodeMajor -ge 18) {
        Write-Success "Node.js $nodeVersion ✓"
    } else {
        throw "Node.js must be >= 18.0.0 (you have $nodeVersion)"
    }
} catch {
    Write-Error-Custom "Node.js not found or version check failed"
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Step "Checking npm installation..."
try {
    $npmVersion = npm --version
    Write-Success "npm $npmVersion ✓"
} catch {
    Write-Error-Custom "npm not found"
    exit 1
}

# 2. Check .env Files
Write-Header "CHECKING CONFIGURATION"

Write-Step "Checking backend/.env..."
if (-not (Test-Path "backend/.env")) {
    if (Test-Path "backend/.env.sample") {
        Write-Step "Creating backend/.env from template..." "ℹ️"
        Copy-Item "backend/.env.sample" "backend/.env"
        Write-Host ""
        Write-Host "⚠️  ATTENTION: Edit backend/.env with your credentials:" -ForegroundColor Yellow
        Write-Host "   - SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
        Write-Host "   - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET" -ForegroundColor Yellow
        Write-Host "   - STRIPE_SECRET_KEY" -ForegroundColor Yellow
        Write-Host "   - JWT_SECRET (generate random string, min 32 chars)" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter once you've filled backend/.env"
    }
}

if (Test-Path "backend/.env") {
    Write-Success "backend/.env found ✓"
} else {
    Write-Error-Custom "backend/.env not found. Please create it from .env.sample"
    exit 1
}

Write-Step "Checking frontend/.env..."
if (-not (Test-Path "frontend/.env")) {
    if (Test-Path "frontend/.env.sample") {
        Write-Step "Creating frontend/.env from template..." "ℹ️"
        Copy-Item "frontend/.env.sample" "frontend/.env"
        Write-Host ""
        Write-Host "⚠️  ATTENTION: Edit frontend/.env with your credentials:" -ForegroundColor Yellow
        Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor Yellow
        Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter once you've filled frontend/.env"
    }
}

if (Test-Path "frontend/.env") {
    Write-Success "frontend/.env found ✓"
}

# 3. Install Dependencies
Write-Header "INSTALLING DEPENDENCIES"

if ("backend" -notin $Skip) {
    Write-Step "Installing backend dependencies..."
    
    if (-not (Test-Path "backend/node_modules")) {
        Push-Location "backend"
        npm install 2>&1 | Out-Null
        Pop-Location
        Write-Success "Backend dependencies installed ✓"
    } else {
        Write-Success "Backend dependencies already installed ✓"
    }
} else {
    Write-Host "Skipping backend setup" -ForegroundColor Yellow
}

if ("frontend" -notin $Skip) {
    Write-Step "Installing frontend dependencies..."
    
    if (-not (Test-Path "frontend/node_modules")) {
        Push-Location "frontend"
        npm install 2>&1 | Out-Null
        Pop-Location
        Write-Success "Frontend dependencies installed ✓"
    } else {
        Write-Success "Frontend dependencies already installed ✓"
    }
} else {
    Write-Host "Skipping frontend setup" -ForegroundColor Yellow
}

# 4. Display Launch Instructions
Write-Header "SETUP COMPLETE!"

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Run both services (requires 2 terminals)" -ForegroundColor White
Write-Host "  Terminal 1 (Backend):" -ForegroundColor White
Write-Host "    cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "    cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then visit: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use included launch scripts" -ForegroundColor White
Write-Host "  PowerShell:" -ForegroundColor White
Write-Host "    .\launch-backend.ps1" -ForegroundColor Gray
Write-Host "    .\launch-frontend.ps1" -ForegroundColor Gray
Write-Host ""

# 5. Offer to Start Services
Write-Host ""
$response = Read-Host "Would you like to start the services now? (y/n)"

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Header "STARTING SERVICES"
    
    Write-Step "Backend will start on: http://localhost:3001" "🚀"
    Write-Step "Frontend will start on: http://localhost:5173" "🚀"
    Write-Host ""
    
    # Start backend in background
    if ("backend" -notin $Skip) {
        Write-Host "Starting backend..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal
        Start-Sleep -Seconds 3
    }
    
    # Start frontend in background
    if ("frontend" -notin $Skip) {
        Write-Host "Starting frontend..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Success "Services launched in new windows"
    Write-Host "Opening application in browser..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5173"
} else {
    Write-Host ""
    Write-Host "To start manually, run:" -ForegroundColor Yellow
    Write-Host "  cd backend && npm run dev" -ForegroundColor Gray
    Write-Host "  cd frontend && npm run dev" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📚 Documentation: GETTING-STARTED.md" -ForegroundColor Cyan
Write-Host "✨ Happy coding!" -ForegroundColor Cyan
