# Dot-source this file so JAVA_HOME and PATH also apply to subsequent commands:
# . ./scripts/use-java.ps1
$root = Split-Path $PSScriptRoot -Parent
$localJdk = Join-Path $env:LOCALAPPDATA 'Programs/Java/jdk-21.0.13'
if (-not (Test-Path "$localJdk/bin/java.exe")) {
    $localJdk = Join-Path $root '.tools/java21/jdk-21.0.13'
}
if (-not (Test-Path "$localJdk/bin/java.exe")) {
    throw 'Install a patched JDK and set JAVA_HOME. See security/README.md.'
}
$env:JAVA_HOME = $localJdk
$env:PATH = "$localJdk/bin;$env:PATH"
