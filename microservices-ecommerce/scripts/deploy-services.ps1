[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    foreach ($kind in @('dependencies','images')) {
        $summary = Get-Content "security/reports/scan-summary-$kind.json" -Raw | ConvertFrom-Json
        $expected = if ($kind -eq 'dependencies') { 8 } else { 7 }
        if ($summary.Count -ne $expected -or @($summary | Where-Object { $_.Vulnerabilities -ne 0 }).Count -gt 0) {
            throw "Complete the $kind scan without findings before deployment."
        }
    }
    foreach ($service in @('api-gateway','product-service','inventory-service','order-service','payment-service','notification-service')) {
        & minikube image load "${service}:security-20261023"
        if ($LASTEXITCODE -ne 0) { throw "Image load failed for $service" }
    }
    foreach ($name in @('gateway','product','inventory','order','payment','notification')) {
        & kubectl --context minikube -n default apply -f "K8s/$name-deployment.yaml"
        if ($LASTEXITCODE -ne 0) { throw "Deployment failed for $name" }
    }
    Write-Output 'Service rollouts started. Check rollout status and restore port-forwards after pods are replaced.'
} finally { Pop-Location }
