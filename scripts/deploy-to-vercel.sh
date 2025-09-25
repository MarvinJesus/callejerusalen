#!/bin/bash

# ==============================================
# Script de Despliegue a Vercel - Calle Jerusalén Community
# ==============================================
# 
# Este script automatiza el proceso de despliegue en Vercel
# Incluye configuración de variables de entorno y despliegue
#
# Uso:
#   1. chmod +x scripts/deploy-to-vercel.sh
#   2. ./scripts/deploy-to-vercel.sh
#

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${2}${1}${NC}"
}

print_step() {
    print_message "📋 $1" "$BLUE"
}

print_success() {
    print_message "✅ $1" "$GREEN"
}

print_warning() {
    print_message "⚠️  $1" "$YELLOW"
}

print_error() {
    print_message "❌ $1" "$RED"
}

# Verificar que Vercel CLI esté instalado
check_vercel_cli() {
    print_step "Verificando Vercel CLI..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI no está instalado"
        print_message "Instala Vercel CLI con: npm install -g vercel" "$YELLOW"
        exit 1
    fi
    
    print_success "Vercel CLI está instalado"
}

# Verificar login en Vercel
check_vercel_login() {
    print_step "Verificando login en Vercel..."
    
    if ! vercel whoami &> /dev/null; then
        print_error "No estás logueado en Vercel"
        print_message "Ejecuta: vercel login" "$YELLOW"
        exit 1
    fi
    
    print_success "Logueado en Vercel como: $(vercel whoami)"
}

# Función para configurar variables de entorno
setup_env_variables() {
    print_step "Configurando variables de entorno en Vercel..."
    
    # Array de variables con sus valores por defecto (para testing)
    declare -A env_vars=(
        ["@firebase_api_key"]="demo-api-key"
        ["@firebase_auth_domain"]="demo-project.firebaseapp.com"
        ["@firebase_project_id"]="demo-project"
        ["@firebase_storage_bucket"]="demo-project.appspot.com"
        ["@firebase_messaging_sender_id"]="123456789"
        ["@firebase_app_id"]="demo-app-id"
        ["@firebase_measurement_id"]="G-DEMO123456"
        ["@google_maps_api_key"]="demo-maps-key"
        ["@firebase_client_email"]="demo@demo-project.iam.gserviceaccount.com"
        ["@firebase_private_key"]="-----BEGIN PRIVATE KEY-----\nDEMO_KEY\n-----END PRIVATE KEY-----\n"
    )
    
    print_warning "IMPORTANTE: Este script configurará variables de DEMO"
    print_warning "Debes reemplazar estas variables con los valores reales en el dashboard de Vercel"
    
    read -p "¿Continuar con valores de demo? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Configuración cancelada. Configura las variables manualmente en Vercel Dashboard" "$YELLOW"
        return 0
    fi
    
    # Configurar cada variable
    for var_name in "${!env_vars[@]}"; do
        print_step "Configurando $var_name..."
        
        # Intentar configurar la variable (esto puede fallar si ya existe)
        if vercel env add "$var_name" production <<< "${env_vars[$var_name]}" 2>/dev/null; then
            print_success "Variable $var_name configurada"
        else
            print_warning "Variable $var_name ya existe o hubo un error"
        fi
    done
}

# Función para hacer build del proyecto
build_project() {
    print_step "Construyendo el proyecto..."
    
    if npm run build; then
        print_success "Build completado exitosamente"
    else
        print_error "Error en el build"
        exit 1
    fi
}

# Función para desplegar a Vercel
deploy_to_vercel() {
    print_step "Desplegando a Vercel..."
    
    if vercel --prod; then
        print_success "Despliegue completado exitosamente"
    else
        print_error "Error en el despliegue"
        exit 1
    fi
}

# Función para mostrar información post-despliegue
show_post_deploy_info() {
    print_step "Información post-despliegue"
    
    echo
    print_message "🎉 ¡Despliegue completado!" "$GREEN"
    echo
    print_message "📚 Próximos pasos:" "$BLUE"
    print_message "   1. Ve al dashboard de Vercel para ver tu aplicación" "$YELLOW"
    print_message "   2. Reemplaza las variables de entorno de demo con valores reales" "$YELLOW"
    print_message "   3. Prueba todas las funcionalidades de la aplicación" "$YELLOW"
    print_message "   4. Configura un dominio personalizado si es necesario" "$YELLOW"
    echo
    print_message "🔧 Variables de entorno que debes configurar:" "$BLUE"
    print_message "   - @firebase_api_key" "$YELLOW"
    print_message "   - @firebase_auth_domain" "$YELLOW"
    print_message "   - @firebase_project_id" "$YELLOW"
    print_message "   - @firebase_storage_bucket" "$YELLOW"
    print_message "   - @firebase_messaging_sender_id" "$YELLOW"
    print_message "   - @firebase_app_id" "$YELLOW"
    print_message "   - @firebase_client_email" "$YELLOW"
    print_message "   - @firebase_private_key" "$YELLOW"
    echo
    print_message "📖 Consulta VERCEL_DEPLOYMENT.md para instrucciones detalladas" "$BLUE"
}

# Función principal
main() {
    print_message "🚀 Script de Despliegue a Vercel - Calle Jerusalén Community" "$BLUE"
    print_message "=" | tr -d '\n' && printf '%.0s=' {1..60} && echo
    
    # Verificaciones previas
    check_vercel_cli
    check_vercel_login
    
    echo
    print_message "¿Qué quieres hacer?" "$BLUE"
    echo "1) Solo configurar variables de entorno"
    echo "2) Solo desplegar (asumiendo que las variables ya están configuradas)"
    echo "3) Configurar variables y desplegar (completo)"
    echo "4) Salir"
    
    read -p "Selecciona una opción (1-4): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            setup_env_variables
            ;;
        2)
            build_project
            deploy_to_vercel
            show_post_deploy_info
            ;;
        3)
            setup_env_variables
            build_project
            deploy_to_vercel
            show_post_deploy_info
            ;;
        4)
            print_message "Saliendo..." "$YELLOW"
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"

