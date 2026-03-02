<#
.SYNOPSIS
  Simulates realistic user traffic against the Life Gamified API.
  Creates tasks, subtasks, toggles completions, checks stats, and
  deletes some tasks — producing a rich spread of metrics for the
  Prometheus + Grafana monitoring stack.

.DESCRIPTION
  Run this AFTER `docker compose up -d`.
  The backend must be reachable at http://localhost:3001.

.EXAMPLE
  .\scripts\generate-traffic.ps1            # default: 3 rounds
  .\scripts\generate-traffic.ps1 -Rounds 10 # heavier load
#>
param(
  [int]$Rounds = 5,
  [string]$Base = "http://localhost:3001"
)

$ErrorActionPreference = "Continue"

function Log($msg) { Write-Host "[traffic] $msg" -ForegroundColor Cyan }

# ── Helpers ──────────────────────────────────────────────
function New-Task([string]$title, [string]$parentId) {
  $body = @{ title = $title }
  if ($parentId) { $body.parent_id = $parentId }
  $json = $body | ConvertTo-Json
  try {
    $r = Invoke-RestMethod -Uri "$Base/api/tasks" -Method POST -Body $json -ContentType "application/json"
    return $r
  } catch {
    Write-Host "  WARN: POST /api/tasks failed: $_" -ForegroundColor Yellow
    return $null
  }
}

function Toggle-Task([string]$id) {
  try {
    Invoke-RestMethod -Uri "$Base/api/tasks/$id" -Method PATCH | Out-Null
  } catch {
    Write-Host "  WARN: PATCH /api/tasks/$id failed: $_" -ForegroundColor Yellow
  }
}

function Remove-Task([string]$id) {
  try {
    Invoke-WebRequest -Uri "$Base/api/tasks/$id" -Method DELETE -UseBasicParsing | Out-Null
  } catch {
    Write-Host "  WARN: DELETE /api/tasks/$id failed: $_" -ForegroundColor Yellow
  }
}

function Get-Tasks  { Invoke-RestMethod -Uri "$Base/api/tasks"    }
function Get-Stats  { Invoke-RestMethod -Uri "$Base/api/stats"    }
function Get-Health { Invoke-RestMethod -Uri "$Base/api/health"   }

# ── Pre-flight ───────────────────────────────────────────
Log "Checking backend health..."
try {
  $h = Get-Health
  Log "Backend is $($h.status)"
} catch {
  Write-Host "ERROR: Backend not reachable at $Base" -ForegroundColor Red
  exit 1
}

# ── Task names for realism ───────────────────────────────
$taskNames = @(
  "Review pull request",
  "Update Kubernetes manifests",
  "Write unit tests",
  "Fix CI pipeline",
  "Deploy to staging",
  "Update documentation",
  "Set up monitoring alerts",
  "Refactor database queries",
  "Configure Terraform module",
  "Optimize Docker image",
  "Run load testing",
  "Merge feature branch",
  "Create API endpoint",
  "Design system architecture",
  "Implement caching layer"
)

$subtaskNames = @(
  "Draft initial version",
  "Get code review",
  "Write tests",
  "Update README",
  "Verify in staging",
  "Check metrics",
  "Run linter"
)

# keep track of created task IDs
$allTaskIds = [System.Collections.ArrayList]::new()

Log "Starting $Rounds rounds of simulated traffic..."
Write-Host ""

for ($round = 1; $round -le $Rounds; $round++) {
  Log "──── Round $round / $Rounds ────"

  # 1) Health check
  Get-Health | Out-Null
  Log "  Health check OK"

  # 2) Create 2-3 main tasks
  $numTasks = Get-Random -Minimum 2 -Maximum 4
  for ($i = 0; $i -lt $numTasks; $i++) {
    $name = $taskNames | Get-Random
    $task = New-Task -title "$name (R$round-$i)"
    if ($task) {
      $allTaskIds.Add($task.id) | Out-Null
      Log "  Created task: $($task.title)"

      # 3) Add 1-2 subtasks to each task
      $numSubs = Get-Random -Minimum 1 -Maximum 3
      for ($j = 0; $j -lt $numSubs; $j++) {
        $subName = $subtaskNames | Get-Random
        $sub = New-Task -title "$subName" -parentId $task.id
        if ($sub) {
          $allTaskIds.Add($sub.id) | Out-Null
          Log "    + subtask: $($sub.title)"
        }
      }
    }
  }

  # 4) Fetch tasks list (simulates page load)
  Get-Tasks | Out-Null
  Log "  Fetched tasks list"

  # 5) Toggle some tasks complete
  if ($allTaskIds.Count -gt 0) {
    $toggleCount = [Math]::Min(3, $allTaskIds.Count)
    for ($t = 0; $t -lt $toggleCount; $t++) {
      $randomId = $allTaskIds | Get-Random
      Toggle-Task -id $randomId
      Log "  Toggled task $randomId"
    }
  }

  # 6) Check stats (simulates dashboard refresh)
  $stats = Get-Stats
  $g = $stats.gems; $sk = $stats.current_streak; $tc = $stats.today_completed; $dg = $stats.daily_goal
  Log "  Stats - Gems: $g | Streak: $sk | Today: $tc/$dg"

  # 7) Delete one task occasionally
  if ($round % 2 -eq 0 -and $allTaskIds.Count -gt 2) {
    $deleteId = $allTaskIds | Get-Random
    Remove-Task -id $deleteId
    $allTaskIds.Remove($deleteId)
    Log "  Deleted task $deleteId"
  }

  # 8) Small delay to spread metrics over time
  Start-Sleep -Seconds 2

  Write-Host ""
}

# ── Final summary ────────────────────────────────────────
$finalStats = Get-Stats
Write-Host ""
Log '======================================='
Log 'Traffic generation complete!'
$msg = "  Rounds:          {0}" -f $Rounds
Log $msg
$msg = "  Tasks created:   {0} (remaining)" -f $allTaskIds.Count
Log $msg
$msg = "  Gems:            {0}" -f $finalStats.gems
Log $msg
$msg = "  Streak:          {0}" -f $finalStats.current_streak
Log $msg
$todayDone = $finalStats.today_completed
$goal = $finalStats.daily_goal
$msg = "  Today completed: $todayDone / $goal"
Log $msg
Log '======================================='
Log ''
Log 'Open Grafana at    http://localhost:3000   (admin / admin)'
Log 'Open Prometheus at http://localhost:9090'
