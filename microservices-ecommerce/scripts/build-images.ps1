[CmdletBinding()]
param(
    [string]$Tag = 'security-20261023',
    [switch]$BasesOnly
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    New-Item -ItemType Directory -Force security/reports | Out-Null
    $ErrorActionPreference = 'Continue'
    & docker build --target runtime -t 'ferrestore-java:21.0.13' . *> security/reports/java-image-build.log
    $result = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($result -ne 0) { throw 'Java image build failed; see security/reports/java-image-build.log' }
    $ErrorActionPreference = 'Continue'
    & docker build -f docker/keycloak/Dockerfile -t 'ferrestore-keycloak:26.8.1-java21.0.13' . *> security/reports/keycloak-image-build.log
    $result = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($result -ne 0) { throw 'Keycloak image build failed; see security/reports/keycloak-image-build.log' }
    if (-not $BasesOnly) {
        foreach ($service in @('api-gateway','product-service','inventory-service','order-service','payment-service','notification-service')) {
            if (-not (Test-Path "$service/target/$service-0.0.1-SNAPSHOT.jar")) { throw "Build and verify $service first." }
            $ErrorActionPreference = 'Continue'
            & docker build --target local --build-arg "SERVICE=$service" -t "${service}:$Tag" . *> "security/reports/$service-image-build.log"
            $result = $LASTEXITCODE
            $ErrorActionPreference = 'Stop'
            if ($result -ne 0) { throw "Image build failed for $service" }
            Write-Output "Built ${service}:$Tag"
        }
    }
    Write-Output 'Image builds completed.'
} finally { Pop-Location }
