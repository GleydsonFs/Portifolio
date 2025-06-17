#!/bin/bash

# Script para iniciar o portfólio com frontend e backend
echo "🚀 Iniciando Portfólio Gleydson França..."
echo "📁 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📧 Sistema de e-mails configurado para: gleydsonfsantos@hotmail.com"
echo ""
echo "Para parar os serviços, pressione Ctrl+C"
echo ""

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Por favor, instale o Python3 primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências npm..."
    npm install
fi

# Verificar se o ambiente virtual do Flask existe
if [ ! -d "email_backend/venv" ]; then
    echo "❌ Ambiente virtual do Flask não encontrado em email_backend/venv"
    echo "Por favor, execute o setup do Flask primeiro."
    exit 1
fi

# Iniciar os serviços
npm run dev

