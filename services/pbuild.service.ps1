function Execute-Command {
  param (
      [string]$Command,
      [string]$ArgumentList
  )
  try {
      # Splitting arguments into an array, assuming $ArgumentList is a space-separated list of arguments
      $arguments = $ArgumentList -split ' '
      $output = & $Command $arguments *>&1
      $output | ForEach-Object { Write-Output $_ }
      
      if ($LASTEXITCODE -ne 0) {
          throw "Command failed with exit code $LASTEXITCODE"
      }
  } catch {
      throw $_
  }
}

try {
  # Execute-Command "node" "./services/versionScript.js increment"
  Execute-Command "npm" "run clean"
  Execute-Command "npm" "run bundle"
  Execute-Command "npm" "run package-solution"
  Execute-Command "npm" "run deploy"
  Write-Output "Build successful"
} catch {
  Write-Output "Build failed, reverting version number"
  # Execute-Command "node" "./services/versionScript.js decrement"
}
