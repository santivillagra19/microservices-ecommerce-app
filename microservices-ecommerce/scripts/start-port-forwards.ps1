[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    New-Item -ItemType Directory -Force security/reports | Out-Null
    foreach ($entry in @(@{Name='keycloak';Port=8080}, @{Name='gateway-service';Port=9000})) {
        $connections = @(Get-NetTCPConnection -State Listen -LocalPort $entry.Port -ErrorAction SilentlyContinue)
        foreach ($connection in $connections) {
            $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$($connection.OwningProcess)"
            if ($owner.CommandLine -notmatch "kubectl.*port-forward.*service/$($entry.Name)") {
                throw "Port $($entry.Port) belongs to another process; it was left running."
            }
            Stop-Process -Id $connection.OwningProcess
        }
        Start-Process -FilePath kubectl -ArgumentList @('--context','minikube','-n','default','port-forward',"service/$($entry.Name)","$($entry.Port):$($entry.Port)",'--address','127.0.0.1') -WindowStyle Hidden -RedirectStandardOutput "security/reports/$($entry.Name)-port-forward.log" -RedirectStandardError "security/reports/$($entry.Name)-port-forward-error.log"
        Write-Output "$($entry.Name): http://localhost:$($entry.Port)"
    }
} finally { Pop-Location }
