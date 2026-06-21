# Claude Code + DeepSeek Setup Script for Windows PowerShell

# สีสำหรับ output
$green = [System.ConsoleColor]::Green
$yellow = [System.ConsoleColor]::Yellow
$red = [System.ConsoleColor]::Red

Write-Host "=== Claude Code + DeepSeek Proxy Setup ===" -ForegroundColor $green

# 1. ตรวจสอบ Python
Write-Host "`n[1/5] ตรวจสอบ Python..." -ForegroundColor $yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor $green
} else {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor $red
    exit 1
}

# 2. ติดตั้ง dependencies
Write-Host "`n[2/5] ติดตั้ง Python dependencies..." -ForegroundColor $yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor $red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor $green

# 3. ตรวจสอบ Node.js
Write-Host "`n[3/5] ตรวจสอบ Node.js..." -ForegroundColor $yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor $green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js" -ForegroundColor $red
    exit 1
}

# 4. ติดตั้ง Claude Code
Write-Host "`n[4/5] ติดตั้ง Claude Code..." -ForegroundColor $yellow
npm install -g "@anthropic-ai/claude-code"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Could not install Claude Code globally (may already be installed)" -ForegroundColor $yellow
}

# 5. ตรวจสอบ .env
Write-Host "`n[5/5] ตรวจสอบ DeepSeek API Key..." -ForegroundColor $yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file (edit it with your DeepSeek API key)" -ForegroundColor $yellow
}

if (-not (Get-Content ".env" | Select-String "sk-")) {
    Write-Host "⚠ Please update .env with your DeepSeek API key" -ForegroundColor $red
    Write-Host "  1. Get API key from: https://platform.deepseek.com/" -ForegroundColor $yellow
    Write-Host "  2. Edit .env file with your key" -ForegroundColor $yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor $green
Write-Host "`nTo start the proxy server, run:" -ForegroundColor $yellow
Write-Host "  python proxy.py" -ForegroundColor $green
Write-Host "`nIn another terminal, set environment variables and run Claude Code:" -ForegroundColor $yellow
Write-Host '  $env:ANTHROPIC_BASE_URL="http://localhost:8086"' -ForegroundColor $green
Write-Host '  $env:ANTHROPIC_AUTH_TOKEN="dummy"' -ForegroundColor $green
Write-Host "  claude" -ForegroundColor $green
