param(
    [string]$ComposeFile = "docker-compose.e2e.yml"
)

$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$composeArgs = @("compose", "-f", (Join-Path $projectRoot $ComposeFile))

& docker @composeArgs down --volumes --remove-orphans
if ($LASTEXITCODE -ne 0) { throw "No se pudo eliminar el stack E2E anterior." }

& docker @composeArgs up --detach
if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el stack E2E." }

$deadline = (Get-Date).AddMinutes(3)
do {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -TimeoutSec 5
        if ($health.status -eq "UP") { break }
    } catch {
        Start-Sleep -Seconds 2
    }
} while ((Get-Date) -lt $deadline)

if (-not $health -or $health.status -ne "UP") {
    throw "El backend E2E no respondió saludable en tres minutos. Revisá 'docker compose -f $ComposeFile logs backend'."
}

& (Join-Path $PSScriptRoot "seed.ps1") -ComposeFile $ComposeFile
if ($LASTEXITCODE -ne 0) { throw "No se pudo aplicar la semilla E2E." }

$frontReady = $false
$deadline = (Get-Date).AddMinutes(2)
do {
    try {
        Invoke-WebRequest -Uri "http://localhost:5181/login" -TimeoutSec 5 | Out-Null
        $frontReady = $true
        break
    } catch {
        Start-Sleep -Seconds 2
    }
} while ((Get-Date) -lt $deadline)

if (-not $frontReady) {
    throw "front2 no respondió en dos minutos. Revisá 'docker compose -f $ComposeFile logs front2'."
}

Write-Host "Stack E2E listo: front2 http://localhost:5181, backend http://localhost:8082"
