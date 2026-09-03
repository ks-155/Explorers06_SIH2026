# SOIS Phase 4 verification E2E proof, live backend only
# Base URL is localhost 3001, all routes under api v1
# Flow covers employer create, employment create, verify, evidence, confirm
# All literal strings use single quotes, dynamic parts join with plus

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3001'

Write-Host 'Step 0: login as admin for employer create'
try {
  $adminLoginBody = '{"identifier":"admin@sois.in","password":"admin123456"}'
  $adminLogin = Invoke-RestMethod -Uri ($base + '/api/v1/auth/login') -Method 'Post' -Body $adminLoginBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: admin login failed: ' + $_.Exception.Message)
  exit 1
}
$adminToken = $adminLogin.accessToken
if (-not $adminToken) {
  Write-Host 'FAIL: admin login missing accessToken'
  exit 1
}
Write-Host 'PASS: admin login ok'

Write-Host 'Step a: create employer as admin'
try {
  $employerBody = '{"name":"Demo P4 Employer"}'
  $employerHeaders = @{ Authorization = ('Bearer ' + $adminToken) }
  $employerResp = Invoke-RestMethod -Uri ($base + '/api/v1/employers') -Method 'Post' -Headers $employerHeaders -Body $employerBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: create employer failed: ' + $_.Exception.Message)
  exit 1
}
$employerId = $employerResp.id
if (-not $employerId) {
  Write-Host 'FAIL: create employer missing id'
  exit 1
}
Write-Host ('PASS: create employer id=' + $employerId)

Write-Host 'Step b: login as trainee'
try {
  $traineeLoginBody = '{"identifier":"trainee@sois.in","password":"trainee123456"}'
  $traineeLogin = Invoke-RestMethod -Uri ($base + '/api/v1/auth/login') -Method 'Post' -Body $traineeLoginBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: trainee login failed: ' + $_.Exception.Message)
  exit 1
}
$traineeToken = $traineeLogin.accessToken
if (-not $traineeToken) {
  Write-Host 'FAIL: trainee login missing accessToken'
  exit 1
}
Write-Host 'PASS: trainee login ok'

Write-Host 'Step c: create employment as trainee, expect 201 and score 20'
try {
  $employmentBody = ('{"trainee_id":"00000000-0000-0000-0000-000000000000","employer_id":"' + $employerId + '","job_role":"Solar Technician","employment_type":"full_time","current_salary":18000}')
  $traineeHeaders = @{ Authorization = ('Bearer ' + $traineeToken) }
  $employmentResp = Invoke-RestMethod -Uri ($base + '/api/v1/employment') -Method 'Post' -Headers $traineeHeaders -Body $employmentBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: create employment failed: ' + $_.Exception.Message)
  exit 1
}
$employmentId = $employmentResp.id
if (-not $employmentId) {
  Write-Host 'FAIL: create employment missing id'
  exit 1
}
if ($employmentResp.confidence_score -ne 20) {
  Write-Host ('FAIL: create employment confidence_score expected 20 got ' + $employmentResp.confidence_score)
  exit 1
}
Write-Host ('PASS: create employment id=' + $employmentId + ' score=20')

Write-Host 'Step d: login as admin again'
try {
  $adminLoginBody2 = '{"identifier":"admin@sois.in","password":"admin123456"}'
  $adminLogin2 = Invoke-RestMethod -Uri ($base + '/api/v1/auth/login') -Method 'Post' -Body $adminLoginBody2 -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: admin relogin failed: ' + $_.Exception.Message)
  exit 1
}
$adminToken = $adminLogin2.accessToken
if (-not $adminToken) {
  Write-Host 'FAIL: admin relogin missing accessToken'
  exit 1
}
Write-Host 'PASS: admin relogin ok'

Write-Host 'Step e: trigger verification as admin, expect 200'
try {
  $adminHeaders = @{ Authorization = ('Bearer ' + $adminToken) }
  $verifyResp = Invoke-RestMethod -Uri ($base + '/api/v1/employment/' + $employmentId + '/verify') -Method 'Post' -Headers $adminHeaders -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: trigger verification failed: ' + $_.Exception.Message)
  exit 1
}
Write-Host 'PASS: trigger verification ok'

Write-Host 'Step f: add salary_slip evidence as admin, expect 2xx'
try {
  $slipBody = '{"evidence_type":"salary_slip","evidence_data":{"file":"demo-slip.pdf"}}'
  $slipResp = Invoke-RestMethod -Uri ($base + '/api/v1/employment/' + $employmentId + '/evidence') -Method 'Post' -Headers $adminHeaders -Body $slipBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: add salary_slip evidence failed: ' + $_.Exception.Message)
  exit 1
}
Write-Host 'PASS: add salary_slip evidence ok'

Write-Host 'Step g: add bank_statement evidence as admin, expect 2xx'
try {
  $bankBody = '{"evidence_type":"bank_statement","evidence_data":{"file":"demo-bank.pdf"}}'
  $bankResp = Invoke-RestMethod -Uri ($base + '/api/v1/employment/' + $employmentId + '/evidence') -Method 'Post' -Headers $adminHeaders -Body $bankBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: add bank_statement evidence failed: ' + $_.Exception.Message)
  exit 1
}
Write-Host 'PASS: add bank_statement evidence ok'

Write-Host 'Step h: employer confirm as admin, expect HIGH gte 80'
try {
  $confirmBody = ('{"employment_id":"' + $employmentId + '","decision":"confirm","still_employed":true,"job_relevant":true}')
  $confirmResp = Invoke-RestMethod -Uri ($base + '/api/v1/employers/' + $employerId + '/verify-employment') -Method 'Post' -Headers $adminHeaders -Body $confirmBody -ContentType 'application/json'
} catch {
  Write-Host ('FAIL: employer verify-employment failed: ' + $_.Exception.Message)
  exit 1
}
$finalScore = $confirmResp.confidence_score
if (-not $finalScore) {
  $finalScore = $confirmResp.breakdown.total
}
$finalLevel = $confirmResp.level
if (-not $finalLevel) {
  $finalLevel = $confirmResp.breakdown.level
}
if (-not $finalScore) {
  Write-Host 'FAIL: confirm response missing confidence_score'
  exit 1
}
if ($finalLevel -ne 'HIGH') {
  Write-Host ('FAIL: final level expected HIGH got ' + $finalLevel)
  exit 1
}
if ($finalScore -lt 80) {
  Write-Host ('FAIL: final score expected gte 80 got ' + $finalScore)
  exit 1
}
Write-Host ('PASS: employer verify-employment score=' + $finalScore + ' level=' + $finalLevel)
Write-Host ('Final confidence_score=' + $finalScore + ' level=' + $finalLevel + ' math=20(self)+40(employer)+15(salary_slip)+10(bank_statement)=85 cap 100 HIGH>=80')
Write-Host 'All Phase 4 verification steps passed'
