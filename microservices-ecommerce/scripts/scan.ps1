[CmdletBinding()]
param([switch]$Images, [switch]$KeycloakOnly)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    $scanner = Join-Path $root '.tools/trivy/trivy.exe'
    if (-not (Test-Path $scanner)) { throw 'Install Trivy in .tools/trivy first.' }
    New-Item -ItemType Directory -Force security/reports | Out-Null
    $targets = @()
    if ($KeycloakOnly) {
        $targets += @{ Name='keycloak-image'; Type='image'; Input='ferrestore-keycloak:26.8.1-java21.0.13' }
    } elseif ($Images) {
        foreach ($service in @('api-gateway','product-service','inventory-service','order-service','payment-service','notification-service')) {
            $targets += @{ Name="$service-image"; Type='image'; Input="${service}:security-20261023" }
        }
        $targets += @{ Name='keycloak-image'; Type='image'; Input='ferrestore-keycloak:26.8.1-java21.0.13' }
    } else {
        [xml]$pom = Get-Content pom.xml
        foreach ($module in $pom.project.modules.module) {
            $targets += @{ Name=$module; Type='sbom'; Input="$module/target/bom.json" }
        }
    }
    $summary = @()
    foreach ($target in $targets) {
        $report = "security/reports/$($target.Name)-vulnerabilities.json"
        $arguments = @('--quiet', $target.Type, '--cache-dir', '.tools/trivy-cache', '--format', 'json', '--output', $report)
        if ($target.Type -eq 'image') { $arguments += @('--scanners','vuln') }
        $arguments += $target.Input
        $ErrorActionPreference = 'Continue'
        & $scanner @arguments 2> "security/reports/$($target.Name)-scan.log"
        $result = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($result -ne 0) { throw "Scanner failed for $($target.Name). Review its scan log." }
        $data = Get-Content $report -Raw | ConvertFrom-Json
        $findings = @($data.Results | ForEach-Object { $_.Vulnerabilities } | Where-Object { $_ })
        $summary += [pscustomobject]@{ Target=$target.Name; Vulnerabilities=$findings.Count }
        Write-Output "$($target.Name): $($findings.Count) vulnerabilities"
    }
    $summary | ConvertTo-Json | Set-Content "security/reports/scan-summary-$(if ($Images -or $KeycloakOnly) {'images'} else {'dependencies'}).json"
    if (@($summary | Where-Object { $_.Vulnerabilities -gt 0 }).Count -gt 0) {
        throw 'Known vulnerabilities remain; review the JSON reports before deploying.'
    }
} finally { Pop-Location }
