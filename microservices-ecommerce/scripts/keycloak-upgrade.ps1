[CmdletBinding()]
param([ValidateSet('Prepare','Deploy')][string]$Mode = 'Prepare')
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
function Invoke-Kubectl {
    $kubectlArgs = @($args)
    # PowerShell consumes a bare -- when invoking a function; restore the
    # separator required by kubectl exec before forwarding the argument array.
    if ($kubectlArgs[0] -eq 'exec' -and $kubectlArgs -notcontains '--') {
        $kubectlArgs = @('exec', $args[1], '--') + @($args | Select-Object -Skip 2)
    }
    & kubectl --context minikube -n default @kubectlArgs
    if ($LASTEXITCODE -ne 0) { throw "kubectl failed: $($args -join ' ')" }
}
try {
    New-Item -ItemType Directory -Force security/backups,security/reports | Out-Null
    if ($Mode -eq 'Prepare') {
        # A real PostgreSQL dump preserves users, credentials, clients and realm keys.
        $stamp = Get-Date -Format yyyyMMdd-HHmmss
        $dump = "keycloak-$stamp.dump"
        Invoke-Kubectl exec deployment/keycloak-db -- pg_dump -U keycloak -d keycloak-db -Fc -f "/tmp/$dump"
        Invoke-Kubectl exec deployment/keycloak-db -- pg_restore --list "/tmp/$dump" | Out-Null
        $dbPod = (Invoke-Kubectl get pod -l app=keycloak-db -o json | ConvertFrom-Json).items[0].metadata.name
        Invoke-Kubectl cp "${dbPod}:/tmp/$dump" "security/backups/$dump"
        if ((Get-Item "security/backups/$dump").Length -eq 0) { throw 'The database backup is empty.' }
        $old = Invoke-Kubectl get deployment keycloak -o json | ConvertFrom-Json
        $old | ConvertTo-Json -Depth 100 | Set-Content "security/backups/keycloak-deployment-$stamp.json"
        Invoke-Kubectl exec deployment/keycloak-db -- createdb -U keycloak keycloak_upgrade_20261023
        Invoke-Kubectl exec deployment/keycloak-db -- pg_restore -U keycloak -d keycloak_upgrade_20261023 --no-owner "/tmp/$dump"
        $manifest = ((Get-Content K8s/security-observability.yaml -Raw) -split '(?m)^---')[0]
        $candidate = $manifest.Replace('name: keycloak', 'name: keycloak-upgrade-check').Replace('app: keycloak', 'app: keycloak-upgrade-check').Replace('5432/keycloak-db', '5432/keycloak_upgrade_20261023')
        # Keep secret references and the imported realm shared; only labels and DB differ.
        $candidate = $candidate.Replace('name: keycloak-upgrade-check-admin-secret', 'name: keycloak-admin-secret').Replace('name: keycloak-upgrade-check-realm-config', 'name: keycloak-realm-config')
        $candidate | Set-Content security/reports/keycloak-upgrade-check.yaml
        Invoke-Kubectl apply -f security/reports/keycloak-upgrade-check.yaml
        Write-Output 'Candidate started against a restored database. Check its rollout and authentication before Deploy.'
    } else {
        $check = Get-Content security/reports/keycloak-migration-check.json -Raw | ConvertFrom-Json
        if (-not $check.adminAuthentication) { throw 'Validate candidate authentication before migration.' }
        $candidate = Invoke-Kubectl get deployment keycloak-upgrade-check -o json | ConvertFrom-Json
        if ($candidate.status.availableReplicas -ne 1) { throw 'The migration candidate is not ready.' }
        # Take a second, current backup immediately before the schema migration.
        $stamp = Get-Date -Format yyyyMMdd-HHmmss
        $dump = "keycloak-before-migration-$stamp.dump"
        Invoke-Kubectl exec deployment/keycloak-db -- pg_dump -U keycloak -d keycloak-db -Fc -f "/tmp/$dump"
        $dbPod = (Invoke-Kubectl get pod -l app=keycloak-db -o json | ConvertFrom-Json).items[0].metadata.name
        Invoke-Kubectl cp "${dbPod}:/tmp/$dump" "security/backups/$dump"
        if ((Get-Item "security/backups/$dump").Length -eq 0) { throw 'The database backup is empty.' }
        $manifest = ((Get-Content K8s/security-observability.yaml -Raw) -split '(?m)^---')[0]
        $manifest | Set-Content security/reports/keycloak-deployment.yaml
        Invoke-Kubectl apply -f security/reports/keycloak-deployment.yaml
        Write-Output "Production migration started. Backup: security/backups/$dump"
    }
} finally { Pop-Location }
