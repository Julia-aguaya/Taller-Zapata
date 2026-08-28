param(
    [string]$ComposeFile = "docker-compose.e2e.yml"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$seedFile = Join-Path $PSScriptRoot "seed.sql"
$composeArgs = @("compose", "-f", (Join-Path $projectRoot $ComposeFile))

Get-Content -Raw $seedFile | & docker @composeArgs exec -T db mysql -uroot -pe2e_root taller_zapata_e2e
if ($LASTEXITCODE -ne 0) { throw "No se pudo aplicar scripts/e2e/seed.sql." }

Write-Host "Semilla E2E aplicada."
