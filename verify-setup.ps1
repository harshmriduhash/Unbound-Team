#!/usr/bin/env powershell
<#
.SYNOPSIS
Setup Verification Tool - Unbound Team

.DESCRIPTION
Comprehensive verification of all setup requirements before launching the application.
#>

$ErrorActionPreference = "Stop"

function Test-Setup {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        🔍 SETUP VERIFICATION TOOL                      ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $allPass = $true
    
    # 1. Node.js Check
    Write-Host "1. Node.js Installation" -ForegroundColor White -BackgroundColor DarkGray
    try {
        $nodeVersion = node --version
        $nodeMajor = [int]$nodeVersion.Split('.')[0].TrimStart('v')
        if ($nodeMajor -ge 18) {
            Write-Host "   ✅ Node.js $nodeVersion (>=18 required)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Node.js $nodeVersion (>=18 required)" -ForegroundColor Red
            $allPass = $false
        }
    } catch {
        Write-Host "   ❌ Node.js not found" -ForegroundColor Red
        $allPass = $false
    }
    
    # 2. npm Check
    Write-Host ""
    Write-Host "2. npm Installation" -ForegroundColor White -BackgroundColor DarkGray
    try {
        $npmVersion = npm --version
        Write-Host "   ✅ npm $npmVersion installed" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ npm not found" -ForegroundColor Red
        $allPass = $false
    }
    
    # 3. Backend Directory
    Write-Host ""
    Write-Host "3. Backend Directory Structure" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "backend") {
        Write-Host "   ✅ backend/ directory found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ backend/ directory not found" -ForegroundColor Red
        $allPass = $false
    }
    
    # 4. Backend .env
    Write-Host ""
    Write-Host "4. Backend Configuration" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "backend/.env") {
        Write-Host "   ✅ backend/.env exists" -ForegroundColor Green
        
        # Check key variables
        $envContent = Get-Content "backend/.env" -Raw
        $checks = @(
            @{Name = "SUPABASE_URL"; Pattern = "SUPABASE_URL=.*" },
            @{Name = "SUPABASE_KEY"; Pattern = "SUPABASE_KEY=.*" },
            @{Name = "JWT_SECRET"; Pattern = "JWT_SECRET=.*" },
            @{Name = "RAZORPAY_KEY_ID"; Pattern = "RAZORPAY_KEY_ID=.*" }
        )
        
        foreach ($check in $checks) {
            if ($envContent -match $check.Pattern) {
                Write-Host "      ✅ $($check.Name) configured" -ForegroundColor Green
            } else {
                Write-Host "      ⚠️  $($check.Name) not found or empty" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ⚠️  backend/.env not found (create from .env.sample)" -ForegroundColor Yellow
    }
    
    # 5. Backend Dependencies
    Write-Host ""
    Write-Host "5. Backend Dependencies" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "backend/node_modules") {
        $pkgCount = (Get-ChildItem "backend/node_modules" -Directory).Count
        Write-Host "   ✅ $pkgCount packages installed" -ForegroundColor Green
    } else {
        Write-Host "   ❌ backend/node_modules not found (run: cd backend && npm install)" -ForegroundColor Red
        $allPass = $false
    }
    
    # 6. Frontend Directory
    Write-Host ""
    Write-Host "6. Frontend Directory Structure" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "frontend") {
        Write-Host "   ✅ frontend/ directory found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ frontend/ directory not found" -ForegroundColor Red
        $allPass = $false
    }
    
    # 7. Frontend .env
    Write-Host ""
    Write-Host "7. Frontend Configuration" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "frontend/.env") {
        Write-Host "   ✅ frontend/.env exists" -ForegroundColor Green
        
        $envContent = Get-Content "frontend/.env" -Raw
        if ($envContent -match "VITE_SUPABASE_URL=") {
            Write-Host "      ✅ VITE_SUPABASE_URL configured" -ForegroundColor Green
        } else {
            Write-Host "      ⚠️  VITE_SUPABASE_URL not configured" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  frontend/.env not found (optional, can create from .env.sample)" -ForegroundColor Yellow
    }
    
    # 8. Frontend Dependencies
    Write-Host ""
    Write-Host "8. Frontend Dependencies" -ForegroundColor White -BackgroundColor DarkGray
    if (Test-Path "frontend/node_modules") {
        $pkgCount = (Get-ChildItem "frontend/node_modules" -Directory).Count
        Write-Host "   ✅ $pkgCount packages installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  frontend/node_modules not found (will install on first 'npm run dev')" -ForegroundColor Yellow
    }
    
    # 9. Ports Available
    Write-Host ""
    Write-Host "9. Port Availability" -ForegroundColor White -BackgroundColor DarkGray
    
    $port3001Used = netstat -ano 2>$null | Select-String ":3001"
    $port5173Used = netstat -ano 2>$null | Select-String ":5173"
    
    if ($port3001Used) {
        Write-Host "   ⚠️  Port 3001 is in use (backend will need different port)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Port 3001 available (backend)" -ForegroundColor Green
    }
    
    if ($port5173Used) {
        Write-Host "   ⚠️  Port 5173 is in use (frontend will need different port)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Port 5173 available (frontend)" -ForegroundColor Green
    }
    
    # 10. Documentation
    Write-Host ""
    Write-Host "10. Documentation" -ForegroundColor White -BackgroundColor DarkGray
    
    $docs = @("GETTING-STARTED.md", "MVP-COMPLETE.md", "SETUP-COMPLETED.md")
    foreach ($doc in $docs) {
        if (Test-Path $doc) {
            Write-Host "    ✅ $doc found" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  $doc not found" -ForegroundColor Yellow
        }
    }
    
    # Summary
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    if ($allPass) {
        Write-Host "✅ ALL CRITICAL CHECKS PASSED - Ready to launch!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SOME CHECKS FAILED - See above for details" -ForegroundColor Yellow
    }
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\start.ps1" -ForegroundColor White
    Write-Host "  2. Or run: cd backend && npm run dev" -ForegroundColor White
    Write-Host "  3. And run: cd frontend && npm run dev" -ForegroundColor White
    Write-Host ""
}

# Run verification
Test-Setup
