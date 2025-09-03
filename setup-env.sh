#!/bin/bash

# Setup script for NAMASTE ICD CLI environment variables
echo "🔧 Setting up environment variables for NAMASTE ICD CLI..."

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Create .env file with ICD API credentials
cat > .env << EOF
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/namaste_icd_db

# WHO ICD-11 API Configuration
WHO_API_BASE_URL=https://id.who.int/icd/release/11/2023
WHO_API_TIMEOUT=10000

# ICD API Authentication
ICD_CLIENT_ID=4e6bb28f-227f-4fb1-a4f1-13740a2d4e54_4028bbfe-ca56-4470-aecd-4d7ef8e99478
ICD_CLIENT_SECRET=aZ0QvQhTZkG6XlnlF//lVPzb5Aevr2VdKNJI66j6168=
ICD_TOKEN_ENDPOINT=https://icdaccessmanagement.who.int/connect/token

# Token Storage (inmemory|mongo)
TOKEN_STORE=inmemory

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info

# FHIR Configuration
FHIR_VERSION=R4
FHIR_BASE_URL=http://localhost:3000/fhir
EOF

echo "✅ Environment file created successfully!"
echo "🔑 ICD API credentials have been configured:"
echo "   Client ID: 4e6bb28f-227f-4fb1-a4f1-13740a2d4f54_c9c79725-47f9-4cd8-a039-b3142bb0261e"
echo "   Client Secret: 1e0iNv0msJLjA26vUzcMSVzLJOBqnid4fe3Sf4ZlXnE="
echo ""
echo "⚠️  IMPORTANT: Keep your .env file secure and never commit it to version control!"
echo "📝 The .env file is already in your .gitignore to prevent accidental commits."
echo ""
echo "🚀 You can now run the CLI commands with proper authentication!"
