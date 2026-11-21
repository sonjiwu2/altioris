param(
    [Parameter(Mandatory)][string]$VpsIp,
    [ValidateRange(1, 65535)][int]$Port = 22,
    [string]$KeyPath = "$env:USERPROFILE\.ssh\altioris_vps",
    [switch]$IncludeSupport
)

$ErrorActionPreference = 'Stop'
$parsedIp = $null
if ($VpsIp -notmatch '^(?:\d{1,3}\.){3}\d{1,3}$' -or
    -not [System.Net.IPAddress]::TryParse($VpsIp, [ref]$parsedIp)) {
    throw 'Enter the public IPv4 address of the VPS.'
}

$root = Split-Path -Parent $PSScriptRoot
$public = Join-Path $root 'public'
$upload = @(
    (Join-Path $public 'app.js'),
    (Join-Path $public 'features\phone-ui.js'),
    (Join-Path $public 'phone.css'),
    (Join-Path $public 'typography.css'),
    (Join-Path $public 'index.html'),
    (Join-Path $PSScriptRoot 'update-vps-ui.sh')
)
$packageMode = 'interface'
if ($IncludeSupport) {
    $packageMode = 'support'
    $upload += @(
        (Join-Path $public 'features\services.js'),
        (Join-Path $public 'features\support-view.js'),
        (Join-Path $root 'server\support-assistant.mjs'),
        (Join-Path $root 'server\support-faq.mjs')
    )
}
foreach ($file in @($KeyPath) + $upload) {
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing file: $file" }
}

$stage = '/root/altioris-ui-update-' + [guid]::NewGuid().ToString('N')
$target = "root@$($parsedIp.IPAddressToString)"
$connection = @('-i', $KeyPath, '-o', 'IdentitiesOnly=yes')
& ssh -p $Port @connection $target "install -d -m 0700 '$stage'"
if ($LASTEXITCODE -ne 0) { throw 'SSH connection failed. Check the VPS address and SSH key.' }

& scp -P $Port @connection @upload "${target}:$stage/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed. VPS staging directory: $stage" }

& ssh -p $Port @connection $target "sed -i 's/\r`$//' '$stage/update-vps-ui.sh' && bash '$stage/update-vps-ui.sh' '$packageMode' && rm -f -- '$stage/app.js' '$stage/phone-ui.js' '$stage/phone.css' '$stage/typography.css' '$stage/index.html' '$stage/update-vps-ui.sh' '$stage/services.js' '$stage/support-view.js' '$stage/support-assistant.mjs' '$stage/support-faq.mjs' && rmdir -- '$stage'"
if ($LASTEXITCODE -ne 0) { throw "Update failed. VPS staging directory: $stage" }
