#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

$App = "ah"
$InstallDir = "$env:USERPROFILE\.agenthosting\bin"
$BaseReleaseUrl = $env:AH_RELEASE_BASE
if (-not $BaseReleaseUrl) { $BaseReleaseUrl = "https://code.agenthosting.app/releases" }

Write-Host ""
Write-Host "AgentHosting CLI Installer" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$arch = "x64"
$filename = "$App-windows-$arch.zip"
$url = "$BaseReleaseUrl/latest"

try {
    $version = (Invoke-RestMethod -Uri $url -UseBasicParsing).Trim().TrimStart("v")
} catch {
    Write-Host "Failed to fetch version information" -ForegroundColor Red
    exit 1
}

$downloadUrl = "$BaseReleaseUrl/v$version/$filename"

Write-Host "Installing AgentHosting CLI version $version..." -ForegroundColor Gray
Write-Host ""

$zipPath = "$env:TEMP\ah_install_$version.zip"
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
} catch {
    Write-Host "Failed to download: $downloadUrl" -ForegroundColor Red
    exit 1
}

Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
Remove-Item $zipPath

$binPath = Join-Path $InstallDir "ah.exe"
if (Test-Path $binPath) {
    Write-Host "Installed to $binPath" -ForegroundColor Green
} else {
    Write-Host "Binary not found after extraction" -ForegroundColor Red
    exit 1
}

$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
    Write-Host "Added $InstallDir to PATH" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  █████╗  ██████╗ ███████╗███╗   ██╗████████╗    ██╗  ██╗ ██████╗ ███████╗████████╗" -ForegroundColor DarkCyan
Write-Host " ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝" -ForegroundColor DarkCyan
Write-Host " ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ███████║██║   ██║███████╗   ██║   " -ForegroundColor DarkCyan
Write-Host " ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██╔══██║██║   ██║╚════██║   ██║   " -ForegroundColor DarkCyan
Write-Host " ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ██║  ██║╚██████╔╝███████║   ██║   " -ForegroundColor DarkCyan
Write-Host " ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   " -ForegroundColor DarkCyan
Write-Host ""
Write-Host "To get started:" -ForegroundColor Gray
Write-Host "  ah providers login agenthosting" -ForegroundColor Cyan
Write-Host "  ah" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docs: https://agenthosting.app/docs" -ForegroundColor Gray
Write-Host ""
