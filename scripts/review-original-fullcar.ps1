# PEDS original Model B + P2.8 — LOCAL owner preview, never deploy.
# Run from Windows PowerShell 7+:
#   pwsh -File scripts/review-original-fullcar.ps1
# The script returns non-zero if missing real CAD/model assets or any QA fails.
[CmdletBinding()]
param(
  [ValidateSet('HIGH','BALANCED','PERFORMANCE')]
  [string]$Quality = 'BALANCED',
  [switch]$SkipInstall,
  [switch]$AllowRebuild
)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $project
$expectedRepo = 'Podium-Effet-De-Sol'
if ((Split-Path $project -Leaf) -ne $expectedRepo) {
  throw "Wrong project directory: expected $expectedRepo. Never run on F1-Overview."
}
$branch = (& git branch --show-current 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -ne 'feat/engineering-inside-machine-v2') {
  throw "Expected feature branch feat/engineering-inside-machine-v2. Current: '$branch'."
}
$python = Join-Path $project '.venv-cad\Scripts\python.exe'
if (!(Test-Path $python)) {
  & py -3.11 -m venv '.venv-cad'
  if ($LASTEXITCODE -ne 0) { throw 'Cannot create Python 3.11 environment' }
}
if (!$SkipInstall) {
  & $python -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) { throw 'pip upgrade failed' }
  & $python -m pip install -r 'tools/cad-first/requirements.txt' vtk playwright
  if ($LASTEXITCODE -ne 0) { throw 'CAD dependencies failed' }
  & $python -m playwright install chromium
  if ($LASTEXITCODE -ne 0) { throw 'Playwright Chromium install failed' }
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
}
$private = Join-Path $project '.local-assets\cad-first'
New-Item -ItemType Directory -Force $private | Out-Null
$source = Join-Path $private 'recovered-p28'
$destination = Join-Path $private 'modelb-p28-final-owner-review'
$arguments = @(
 'tools/cad-first/run_owner_fullcar_review.py',
 '--p28-dir', $source,
 '--out', $destination,
 '--quality', $Quality
)
if ($AllowRebuild) { $arguments += '--allow-rebuild' }
Write-Host 'Original source-only engineering review. No merging or production deployment.'
& $python @arguments
if ($LASTEXITCODE -ne 0) {
  throw "A required asset/QA/browser gate failed. Inspect $destination\review-gates.json"
}
$report = Join-Path $destination 'review-gates.json'
Write-Host "Actual browser review evidence: $report"
Write-Host "The result is a staging preview. Mechanical G2 remains HOLD pending real mating."
