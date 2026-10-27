$ErrorActionPreference = 'Stop'

$checks = @(
    @{ Name = 'Frontend'; Uri = 'http://localhost/' },
    @{ Name = 'Backend health'; Uri = 'http://localhost:8000/health/' },
    @{ Name = 'Clubs API through frontend proxy'; Uri = 'http://localhost/api/clubs/' }
)

foreach ($check in $checks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Uri -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            throw "Unexpected HTTP status $($response.StatusCode)"
        }
        Write-Output "OK: $($check.Name) (HTTP $($response.StatusCode))"
    }
    catch {
        Write-Error "FAILED: $($check.Name) ($($check.Uri)): $($_.Exception.Message)"
        exit 1
    }
}
