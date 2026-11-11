$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$port = 8765
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)

try {
    $listener.Start()
} catch {
    Write-Host "Could not start Clearpath on port $port. Close another app using that port and try again." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$url = "http://127.0.0.1:$port/"
Write-Host "Clearpath is running at $url" -ForegroundColor Green
Write-Host "Keep this window open while you use the app. Press Ctrl+C to stop the local server."
Start-Process $url

$contentTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".webmanifest" = "application/manifest+json; charset=utf-8"
    ".svg" = "image/svg+xml"
    ".png" = "image/png"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            while (($headerLine = $reader.ReadLine()) -and $headerLine.Length -gt 0) { }

            if (-not $requestLine) { continue }
            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2 -or ($parts[0] -ne "GET" -and $parts[0] -ne "HEAD")) {
                $status = "405 Method Not Allowed"
                $body = [System.Text.Encoding]::UTF8.GetBytes("Method not allowed.")
                $mime = "text/plain; charset=utf-8"
            } else {
                $status = "200 OK"
                $path = [System.Uri]::UnescapeDataString(($parts[1] -split '\?', 2)[0])
                if ($path -eq "/") { $path = "/index.html" }
                $relativePath = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
                $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relativePath))

                if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not [System.IO.File]::Exists($filePath)) {
                    $status = "404 Not Found"
                    $body = [System.Text.Encoding]::UTF8.GetBytes("Not found.")
                    $mime = "text/plain; charset=utf-8"
                } else {
                    $body = [System.IO.File]::ReadAllBytes($filePath)
                    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
                    $mime = $contentTypes[$extension]
                    if (-not $mime) { $mime = "application/octet-stream" }
                }
            }

            $responseHeaders = "HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($responseHeaders)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            if ($parts[0] -ne "HEAD") { $stream.Write($body, 0, $body.Length) }
            $stream.Flush()
        } catch {
            Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Yellow
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
