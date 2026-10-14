$port = 8080
$listener = New-Object System.Net.HttpListener

# Ouvir em TODAS as interfaces (localhost + rede local Wi-Fi)
$listener.Prefixes.Add("http://+:$port/")

# Obter IP da rede local para exibir
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress

# Pasta para armazenar fotos temporárias das sessões
$fotoDir = Join-Path $PSScriptRoot "_fotos_temp"
if (-not (Test-Path $fotoDir)) { New-Item -ItemType Directory -Path $fotoDir -Force | Out-Null }

try {
    $listener.Start()
    Write-Host "=========================================="
    Write-Host "  StrategyOS Localhost Server ativo!"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "  PC:       http://localhost:$port"
    if ($localIP) {
        Write-Host "  Celular:  http://${localIP}:$port"
        Write-Host ""
        Write-Host "  Escaneie o QR Code no sistema para conectar o celular!"
    } else {
        Write-Host "  IP local nao detectado. Use localhost."
    }
    Write-Host ""
    Write-Host "=========================================="
} catch {
    Write-Host "Erro ao iniciar listener: $_"
    Write-Host ""
    Write-Host "Se o erro for 'Access is denied', execute como Administrador"
    Write-Host "ou use este comando uma vez (como Admin):"
    Write-Host "  netsh http add urlacl url=http://+:$port/ user=Everyone"
    
    # Fallback: tentar apenas localhost
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://127.0.0.1:$port/")
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        Write-Host ""
        Write-Host "Servidor iniciado em modo local (sem acesso pelo celular)"
        Write-Host "PC: http://localhost:$port"
    } catch {
        Write-Host "Erro fatal ao iniciar servidor: $_"
        exit 1
    }
}

$root = $PSScriptRoot

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "" -or $urlPath -eq "/") { $urlPath = "/index.html" }
        
        # CORS headers para acesso entre dispositivos na rede local
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }
        
        # ===== API DE FOTOS PARA SINCRONIZACAO CELULAR -> PC =====
        
        # POST /api/foto — Receber foto do celular
        if ($urlPath -eq "/api/foto" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $fotoData = $body | ConvertFrom-Json
                $session = $fotoData.session
                if (-not $session) { throw "Session obrigatoria" }
                
                $sessionDir = Join-Path $fotoDir $session
                if (-not (Test-Path $sessionDir)) { New-Item -ItemType Directory -Path $sessionDir -Force | Out-Null }
                
                $fotoId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                $fotoFile = Join-Path $sessionDir "${fotoId}.json"
                
                $fotoObj = @{
                    id = $fotoId
                    base64 = $fotoData.base64
                    descricao = if ($fotoData.descricao) { $fotoData.descricao } else { "Foto" }
                    data = (Get-Date).ToString("o")
                } | ConvertTo-Json -Compress
                
                Set-Content -Path $fotoFile -Value $fotoObj -Encoding UTF8
                
                $resultJson = "{""sucesso"":true,""id"":$fotoId}"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resultJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                $errJson = "{""sucesso"":false,""erro"":""$_""}"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 400
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            $response.Close()
            continue
        }
        
        # GET /api/fotos?session=X — PC busca fotos enviadas pelo celular
        if ($urlPath -eq "/api/fotos" -and $request.HttpMethod -eq "GET") {
            $querySession = $request.QueryString["session"]
            $fotos = @()
            
            if ($querySession) {
                $sessionDir = Join-Path $fotoDir $querySession
                if (Test-Path $sessionDir) {
                    $files = Get-ChildItem -Path $sessionDir -Filter "*.json" | Sort-Object Name
                    foreach ($f in $files) {
                        $content = Get-Content -Path $f.FullName -Raw -Encoding UTF8
                        $fotos += $content
                    }
                }
            }
            
            $resultJson = "[" + ($fotos -join ",") + "]"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($resultJson)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }
        
        # DELETE /api/fotos?session=X — Limpar sessao de fotos
        if ($urlPath -eq "/api/fotos" -and $request.HttpMethod -eq "DELETE") {
            $querySession = $request.QueryString["session"]
            if ($querySession) {
                $sessionDir = Join-Path $fotoDir $querySession
                if (Test-Path $sessionDir) {
                    Remove-Item -Path $sessionDir -Recurse -Force
                }
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("{""sucesso"":true}")
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }

        # POST /api/backup-auto — Salvar arquivo de backup local em disco
        if ($urlPath -eq "/api/backup-auto" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $backupDir = Join-Path $PSScriptRoot "_backups"
                if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
                
                $dataHoje = (Get-Date).ToString("yyyy-MM-dd")
                $backupFile = Join-Path $backupDir "StrategyOS_Backup_${dataHoje}.json"
                
                Set-Content -Path $backupFile -Value $body -Encoding UTF8
                
                $resultJson = "{""sucesso"":true,""arquivo"":""StrategyOS_Backup_${dataHoje}.json""}"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resultJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                $errJson = "{""sucesso"":false,""erro"":""$_""}"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 400
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            $response.Close()
            continue
        }

        # POST /api/backup-zip-telegram — Compactar a pasta raiz e enviar o ZIP via Telegram
        if ($urlPath -eq "/api/backup-zip-telegram" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $body = $reader.ReadToEnd()
            $reader.Close()
            
            try {
                $jsonConfig = $body | ConvertFrom-Json
                $botToken = $jsonConfig.botToken
                $chatId = $jsonConfig.chatId
                
                if (-not $botToken -or -not $chatId) {
                    throw "Token ou Chat ID não informados"
                }

                $dataHoje = (Get-Date).ToString("yyyy-MM-dd")
                $zipName = "StrategyOS_Completo_${dataHoje}.zip"
                $zipPath = Join-Path $env:TEMP $zipName
                
                # Remover zip antigo se existir
                if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
                
                # Excluir pastas pesadas (backups velhos e fotos)
                $tempSource = Join-Path $env:TEMP "StrategyOS_Clone_${dataHoje}"
                if (Test-Path $tempSource) { Remove-Item $tempSource -Recurse -Force }
                New-Item -ItemType Directory -Path $tempSource | Out-Null
                
                # Copiar arquivos importantes ignorando pesados para o temp
                Copy-Item -Path "$PSScriptRoot\*" -Destination $tempSource -Recurse -Exclude "_backups", "_fotos", ".git", "*.zip" -Force
                
                # Compactar
                Compress-Archive -Path "$tempSource\*" -DestinationPath $zipPath -Force
                
                # Enviar para o Telegram usando curl.exe nativo do Windows
                $url = "https://api.telegram.org/bot$botToken/sendDocument"
                $caption = "*BACKUP COMPLETO DO SISTEMA* - $dataHoje`nCodigo fonte + dados atualizados."
                
                & curl.exe -s -F "chat_id=$chatId" -F "caption=$caption" -F "document=@$zipPath" $url | Out-Null
                
                # Limpar temporários
                Remove-Item $zipPath -Force
                Remove-Item $tempSource -Recurse -Force
                
                $resultJson = '{"sucesso":true,"mensagem":"Zip enviado com sucesso via servidor!"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($resultJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } catch {
                $errJson = '{"sucesso":false,"erro":"' + $_.Exception.Message.Replace('"', '\"') + '"}'
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 400
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            $response.Close()
            continue
        }

        # GET /api/ip — Retorna o IP local para gerar QR Code
        if ($urlPath -eq "/api/ip" -and $request.HttpMethod -eq "GET") {
            $ipResult = "{""ip"":""$localIP"",""port"":$port}"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($ipResult)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            continue
        }
        
        # ===== SERVIR ARQUIVOS ESTÁTICOS =====
        $relPath = $urlPath.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $root $relPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".webp" { "image/webp" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                ".webmanifest" { "application/manifest+json" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    } catch {
        Write-Host "Erro na requisicao: $_"
    }
}
