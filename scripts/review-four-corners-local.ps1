# LOCAL four measured wheel WebGL engineering review. NEVER GitHub Actions.
# Windows PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\review-four-corners-local.ps1
# Optional: -P28Dir ".local-assets\cad-first\existing-source" -SkipInstall
[CmdletBinding()]
param(
  [string]$P28Dir = ".local-assets\cad-first\recovered-p28",
  [ValidateSet('HIGH','BALANCED','PERFORMANCE')]
  [string]$Quality='BALANCED',
  [switch]$SkipInstall,
  [switch]$NoRebuild,
  [switch]$SkipWebQA
)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ((Split-Path $root -Leaf) -ne 'Podium-Effet-De-Sol') {
  throw "Wrong repository. This script must run in Podium-Effet-De-Sol, NOT F1-Overview."
}
Set-Location $root
$branch=(& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -ne 'work/engineering-four-corners-local') {
  throw "Expected work/engineering-four-corners-local. Current: $branch."
}
$py=Join-Path $root '.venv-cad\Scripts\python.exe'
if (!(Test-Path $py)) {
  & py -3.11 -m venv '.venv-cad'
  if ($LASTEXITCODE -ne 0) { throw 'Python 3.11 venv creation failed' }
}
if (!$SkipInstall) {
  & $py -m pip install -r 'tools/cad-first/requirements.txt' trimesh vtk playwright
  if ($LASTEXITCODE -ne 0) { throw 'Native CAD/geometry/browser dependencies failed' }
  & $py -m playwright install chromium
  if ($LASTEXITCODE -ne 0) { throw 'Chromium not installed' }
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw 'Local npm ci failed' }
}
if (!(Test-Path 'apps/web/public/models/model-b-eds-optimized-v1.glb')) {
  throw 'Owner original Model B GLB missing; never use a fabricated substitute'
}
$target=Join-Path $root '.local-assets\cad-first\four-corner-owner-review'
New-Item -ItemType Directory -Force $target | Out-Null
$arguments=@(
  'tools/cad-first/run_four_corners_local.py',
  '--p28-dir',$P28Dir,
  '--quality',$Quality,
  '--out',$target
)
if (!$NoRebuild) { $arguments += '--allow-rebuild' }
if ($SkipWebQA) { $arguments += '--skip-web-qa' }
Write-Host 'Original Model B + actual P2.8 CAD / LOCAL Chromium recording'
Write-Host 'Four measured wheel positions; rear source-derived wheel-end visual only'
Write-Host 'No GitHub Actions, commit, push, merge or deployment.'
& $py @arguments
if ($LASTEXITCODE -ne 0) {
  throw "Source/CAD/TypeScript/WebGL QA failed. Check $target\four-wheel-review-gates.json."
}
Write-Host "Local MP4: $target\browser\four-wheel-real-browser.mp4"
Write-Host "Local gate report: $target\four-wheel-review-gates.json"
Write-Host 'Mechanical G2 is HOLD. Rear suspension/upright are NOT independently authored.'
