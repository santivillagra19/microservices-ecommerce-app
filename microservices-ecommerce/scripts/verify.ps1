[CmdletBinding()]
param(
    [string]$JavaHome = $env:JAVA_HOME,
    [switch]$SkipTests,
    [switch]$Scan,
    [string[]]$Modules,
    [string]$LogFile = 'security/reports/maven-verify.log'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    if (-not (Test-Path -LiteralPath "$JavaHome/bin/java.exe")) {
        throw 'Set JAVA_HOME to a patched JDK 21 (21.0.13 or newer).'
    }
    $env:JAVA_HOME = $JavaHome
    $env:PATH = "$JavaHome/bin;$env:PATH"
    New-Item -ItemType Directory -Force security/reports | Out-Null
    $mavenArgs = @('-B', '-ntp', '-fae', 'clean', 'verify')
    if ($Modules) { $mavenArgs += @('-pl', ($Modules -join ',')) }
    if ($SkipTests) { $mavenArgs += '-DskipTests' }
    # Native programs may write normal progress to stderr in Windows PowerShell.
    $ErrorActionPreference = 'Continue'
    & ./api-gateway/mvnw.cmd @mavenArgs *> $LogFile
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    Get-Content $LogFile -Tail 50
    if ($buildExit -ne 0) { throw "Maven failed ($buildExit); see $LogFile" }
    if ($Scan) {
        $scanner = Join-Path $root '.tools/trivy/trivy.exe'
        if (-not (Test-Path $scanner)) { throw 'Install Trivy in .tools/trivy or run the documented scanner command.' }
        [xml]$pom = Get-Content pom.xml
        foreach ($module in $pom.project.modules.module) {
            $ErrorActionPreference = 'Continue'
            & $scanner sbom --cache-dir .tools/trivy-cache --format json --output "security/reports/$module-vulnerabilities.json" --exit-code 1 "$module/target/bom.json" 2> "security/reports/$module-scan.log"
            $scanExit = $LASTEXITCODE
            $ErrorActionPreference = 'Stop'
            if ($scanExit -ne 0) { throw "Vulnerability scan failed for $module; review its JSON report and scan log." }
        }
    }
} finally {
    Pop-Location
}
