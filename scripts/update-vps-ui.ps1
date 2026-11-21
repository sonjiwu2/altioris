param(
    [Parameter(Mandatory)][string]$VpsIp,
    [ValidateRange(1, 65535)][int]$Port = 22,
    [string]$KeyPath = "$env:USERPROFILE\.ssh\altioris_vps"
)

$ErrorActionPreference = 'Stop'
$parsedIp = $null
if ($VpsIp -notmatch '^(?:\d{1,3}\.){3}\d{1,3}$' -or
    -not [System.Net.IPAddress]::TryParse($VpsIp, [ref]$parsedIp)) {
    throw 'Enter the public IPv4 address of the VPS.'
}

$public = Join-Path (Split-Path -Parent $PSScriptRoot) 'public'
$upload = @(
    (Join-Path $public 'app.js'),
    (Join-Path $public 'features\phone-ui.js'),
    (Join-Path $public 'phone.css'),
    (Join-Path $public 'index.html'),
    (Join-Path $PSScriptRoot 'update-vps-ui.sh')
)
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

& ssh -p $Port @connection $target "sed -i 's/\r`$//' '$stage/update-vps-ui.sh' && bash '$stage/update-vps-ui.sh' && rm -f -- '$stage/app.js' '$stage/phone-ui.js' '$stage/phone.css' '$stage/index.html' '$stage/update-vps-ui.sh' && rmdir -- '$stage'"
if ($LASTEXITCODE -ne 0) { throw "Update failed. VPS staging directory: $stage" }
