# ==============================================
# Script de Despliegue a Vercel - Calle Jerusalén Community
# ==============================================
# 
# Este script automatiza el proceso de despliegue en Vercel para Windows
# Incluye configuración de variables de entorno y despliegue
#
# Uso:
#   1. Ejecutar PowerShell como administrador
#   2. Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   3. .\scripts\deploy-to-vercel.ps1
#

param(
    [string]$Action = "interactive"
)

# Función para imprimir mensajes con colores
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorMessage "📋 $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorMessage "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorMessage "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorMessage "❌ $Message" "Red"
}

# Verificar que Node.js esté instalado
function Test-NodeJS {
    Write-Step "Verificando Node.js..."
    
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js está instalado: $nodeVersion"
            return $true
        }
    }
    catch {
        Write-Error "Node.js no está instalado"
        Write-ColorMessage "Instala Node.js desde: https://nodejs.org/" "Yellow"
        return $false
    }
}

# Verificar que Vercel CLI esté instalado
function Test-VercelCLI {
    Write-Step "Verificando Vercel CLI..."
    
    try {
        $vercelVersion = vercel --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Vercel CLI está instalado: $vercelVersion"
            return $true
        }
    }
    catch {
        Write-Error "Vercel CLI no está instalado"
        Write-ColorMessage "Instala Vercel CLI con: npm install -g vercel" "Yellow"
        return $false
    }
}

# Verificar login en Vercel
function Test-VercelLogin {
    Write-Step "Verificando login en Vercel..."
    
    try {
        $user = vercel whoami 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Logueado en Vercel como: $user"
            return $true
        }
    }
    catch {
        Write-Error "No estás logueado en Vercel"
        Write-ColorMessage "Ejecuta: vercel login" "Yellow"
        return $false
    }
}

# Función para mostrar variables de entorno necesarias
function Show-EnvironmentVariables {
    Write-Step "Variables de entorno requeridas para Vercel:"
    Write-Host ""
    
    $envVars = @(
        @{ Name = "@firebase_api_key"; Description = "API Key de Firebase (público)"; Example = "AIzaSyC..." },
        @{ Name = "@firebase_auth_domain"; Description = "Dominio de autenticación de Firebase"; Example = "your-project.firebaseapp.com" },
        @{ Name = "@firebase_project_id"; Description = "ID del proyecto de Firebase"; Example = "your-project-id" },
        @{ Name = "@firebase_storage_bucket"; Description = "Bucket de almacenamiento de Firebase"; Example = "your-project.appspot.com" },
        @{ Name = "@firebase_messaging_sender_id"; Description = "ID del remitente de mensajería"; Example = "123456789012" },
        @{ Name = "@firebase_app_id"; Description = "ID de la aplicación de Firebase"; Example = "1:123456789012:web:abcdef1234567890" },
        @{ Name = "@firebase_measurement_id"; Description = "ID de medición de Firebase Analytics"; Example = "G-XXXXXXXXXX" },
        @{ Name = "@google_maps_api_key"; Description = "API Key para Google Maps"; Example = "AIzaSyC..." },
        @{ Name = "@firebase_client_email"; Description = "Email de la cuenta de servicio de Firebase Admin"; Example = "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com" },
        @{ Name = "@firebase_private_key"; Description = "Clave privada de la cuenta de servicio de Firebase Admin"; Example = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" }
    )
    
    for ($i = 0; $i -lt $envVars.Count; $i++) {
        $var = $envVars[$i]
        Write-Host "   $($i + 1). $($var.Name)" -ForegroundColor Yellow
        Write-Host "      Descripción: $($var.Description)" -ForegroundColor Gray
        Write-Host "      Ejemplo: $($var.Example)" -ForegroundColor Gray
        Write-Host ""
    }
}

# Función para hacer build del proyecto
function Build-Project {
    Write-Step "Construyendo el proyecto..."
    
    try {
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build completado exitosamente"
            return $true
        } else {
            Write-Error "Error en el build"
            return $false
        }
    }
    catch {
        Write-Error "Error ejecutando npm run build: $($_.Exception.Message)"
        return $false
    }
}

# Función para desplegar a Vercel
function Deploy-ToVercel {
    Write-Step "Desplegando a Vercel..."
    
    try {
        vercel --prod
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Despliegue completado exitosamente"
            return $true
        } else {
            Write-Error "Error en el despliegue"
            return $false
        }
    }
    catch {
        Write-Error "Error ejecutando vercel --prod: $($_.Exception.Message)"
        return $false
    }
}

# Función para mostrar información post-despliegue
function Show-PostDeployInfo {
    Write-Step "Información post-despliegue"
    
    Write-Host ""
    Write-ColorMessage "🎉 ¡Despliegue completado!" "Green"
    Write-Host ""
    Write-ColorMessage "📚 Próximos pasos:" "Cyan"
    Write-ColorMessage "   1. Ve al dashboard de Vercel para ver tu aplicación" "Yellow"
    Write-ColorMessage "   2. Configura las variables de entorno con valores reales" "Yellow"
    Write-ColorMessage "   3. Prueba todas las funcionalidades de la aplicación" "Yellow"
    Write-ColorMessage "   4. Configura un dominio personalizado si es necesario" "Yellow"
    Write-Host ""
    Write-ColorMessage "🔧 Para configurar variables de entorno:" "Cyan"
    Write-ColorMessage "   1. Ve a tu proyecto en Vercel Dashboard" "Yellow"
    Write-ColorMessage "   2. Settings → Environment Variables" "Yellow"
    Write-ColorMessage "   3. Agrega cada variable con su valor real" "Yellow"
    Write-Host ""
    Write-ColorMessage "📖 Consulta VERCEL_DEPLOYMENT.md para instrucciones detalladas" "Cyan"
}

# Función para mostrar menú interactivo
function Show-InteractiveMenu {
    Write-Host ""
    Write-ColorMessage "¿Qué quieres hacer?" "Cyan"
    Write-Host "1) Mostrar variables de entorno requeridas"
    Write-Host "2) Solo hacer build del proyecto"
    Write-Host "3) Solo desplegar (asumiendo que las variables ya están configuradas)"
    Write-Host "4) Hacer build y desplegar (completo)"
    Write-Host "5) Salir"
    
    do {
        $choice = Read-Host "Selecciona una opción (1-5)"
        
        switch ($choice) {
            "1" {
                Show-EnvironmentVariables
                return $true
            }
            "2" {
                return Build-Project
            }
            "3" {
                return Deploy-ToVercel
            }
            "4" {
                $buildSuccess = Build-Project
                if ($buildSuccess) {
                    $deploySuccess = Deploy-ToVercel
                    if ($deploySuccess) {
                        Show-PostDeployInfo
                    }
                    return $deploySuccess
                }
                return $false
            }
            "5" {
                Write-ColorMessage "Saliendo..." "Yellow"
                return $true
            }
            default {
                Write-Error "Opción inválida. Selecciona 1-5."
            }
        }
    } while ($true)
}

# Función principal
function Main {
    Write-ColorMessage "🚀 Script de Despliegue a Vercel - Calle Jerusalén Community" "Cyan"
    Write-ColorMessage "=" -NoNewline; Write-Host ("=" * 60) -ForegroundColor Cyan
    
    # Verificaciones previas
    if (-not (Test-NodeJS)) { exit 1 }
    if (-not (Test-VercelCLI)) { exit 1 }
    if (-not (Test-VercelLogin)) { exit 1 }
    
    # Ejecutar acción según parámetro
    switch ($Action.ToLower()) {
        "env" {
            Show-EnvironmentVariables
        }
        "build" {
            Build-Project
        }
        "deploy" {
            Deploy-ToVercel
        }
        "full" {
            $buildSuccess = Build-Project
            if ($buildSuccess) {
                $deploySuccess = Deploy-ToVercel
                if ($deploySuccess) {
                    Show-PostDeployInfo
                }
            }
        }
        "interactive" {
            Show-InteractiveMenu
        }
        default {
            Write-Error "Acción no válida: $Action"
            Write-ColorMessage "Acciones disponibles: env, build, deploy, full, interactive" "Yellow"
            exit 1
        }
    }
}

# Ejecutar función principal
try {
    Main
}
catch {
    Write-Error "Error ejecutando el script: $($_.Exception.Message)"
    exit 1
}

