# CivilAI Backend API Test Script

Write-Host "=== CivilAI Backend API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register User
Write-Host "Test 1: Register User" -ForegroundColor Yellow
$registerBody = @{
    email = "test@civilai.com"
    password = "Test123456"
    fullName = "Test User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody
    
    Write-Host "✅ User registered successfully!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Login
Write-Host "Test 2: Login" -ForegroundColor Yellow
$loginBody = @{
    email = "test@civilai.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host ""
    
    # Test 3: Get Current User
    Write-Host "Test 3: Get Current User" -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $userResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/users/me" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ User profile retrieved!" -ForegroundColor Green
    Write-Host "Email: $($userResponse.email)" -ForegroundColor Gray
    Write-Host "Name: $($userResponse.fullName)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 4: Create Project
    Write-Host "Test 4: Create Project" -ForegroundColor Yellow
    $projectBody = @{
        name = "Test Highway Project"
        description = "NH-44 Expansion - Test Project"
    } | ConvertTo-Json
    
    $projectResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/projects" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $projectBody
    
    $projectId = $projectResponse.id
    Write-Host "✅ Project created!" -ForegroundColor Green
    Write-Host "Project ID: $projectId" -ForegroundColor Gray
    Write-Host "Project Name: $($projectResponse.name)" -ForegroundColor Gray
    Write-Host ""
    
    # Test 5: List Projects
    Write-Host "Test 5: List Projects" -ForegroundColor Yellow
    $projectsResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/projects" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Projects retrieved!" -ForegroundColor Green
    Write-Host "Total Projects: $($projectsResponse.Count)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "=== All Tests Passed! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ User Registration" -ForegroundColor Green
    Write-Host "  ✅ User Login" -ForegroundColor Green
    Write-Host "  ✅ Get User Profile" -ForegroundColor Green
    Write-Host "  ✅ Create Project" -ForegroundColor Green
    Write-Host "  ✅ List Projects" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}
