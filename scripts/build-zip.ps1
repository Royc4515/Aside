<#
.SYNOPSIS
  Builds a self-install ZIP of the Aside extension.

.DESCRIPTION
  Bundles only the files the extension needs at runtime, excluding repo
  scaffolding (docs/, archive/, marketing/, screenshots/, .git/, etc.).
  Output: dist/aside-<version>.zip — drop into chrome://extensions
  (Developer mode → Load unpacked, after unzipping).

.EXAMPLE
  pwsh ./scripts/build-zip.ps1
#>

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$manifest = Get-Content (Join-Path $repoRoot 'manifest.json') -Raw | ConvertFrom-Json
$version  = $manifest.version
$outDir   = Join-Path $repoRoot 'dist'
$stage    = Join-Path $outDir   "aside-$version"
$zipPath  = Join-Path $outDir   "aside-$version.zip"

if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

# Runtime-only payload. Anything not listed here is excluded.
$include = @(
  'manifest.json',
  'background.js',
  '_locales',
  'icons',
  'content',
  'options',
  'popup',
  'providers',
  'shared',
  'sidebar'
)

foreach ($item in $include) {
  $src = Join-Path $repoRoot $item
  if (-not (Test-Path $src)) {
    Write-Warning "Skipping missing: $item"
    continue
  }
  Copy-Item -Path $src -Destination $stage -Recurse -Force
}

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -Force
Remove-Item $stage -Recurse -Force

$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "Built $zipPath ($size KB)" -ForegroundColor Green
