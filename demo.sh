#!/bin/bash

echo "🌿 NAMASTE-ICD CLI Demo"
echo "========================="
echo ""

echo "🚀 Starting demo of the NAMASTE-ICD CLI application..."
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB status..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongod"
    echo "   or"
    echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
fi

echo ""

# Show CLI help
echo "📖 CLI Help Information:"
echo "------------------------"
npm run dev -- --help 2>/dev/null | head -20

echo ""

# Show available commands
echo "🔧 Available Commands:"
echo "---------------------"
echo "1. ingest-namaste <csv-file>     - Import NAMASTE codes from CSV"
echo "2. fetch-icd <query>             - Fetch ICD-11 codes from WHO API"
echo "3. map-code <namaste> <icd>      - Create mappings between codes"
echo "4. search <query>                 - Search across both systems"
echo "5. translate <namaste-code>       - Show ICD-11 mappings"
echo "6. upload-encounter <json-file>   - Upload FHIR encounter"
echo "7. view-logs                      - Show audit logs"
echo "8. status                         - Check system status"
echo ""

# Show sample files
echo "📁 Sample Files Available:"
echo "-------------------------"
if [ -f "sample-namaste.csv" ]; then
    echo "✅ sample-namaste.csv - Sample NAMASTE codes"
    echo "   Contains 20 sample NAMASTE codes for testing"
fi

if [ -f "sample-encounter.json" ]; then
    echo "✅ sample-encounter.json - Sample FHIR encounter"
    echo "   Contains sample patient encounter with dual coding"
fi

echo ""

# Show environment setup
echo "⚙️  Environment Setup:"
echo "---------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found. Please copy env.example to .env and configure:"
    echo "   cp env.example .env"
    echo "   # Edit .env with your MongoDB connection and WHO API settings"
fi

echo ""

# Show project structure
echo "📂 Project Structure:"
echo "-------------------"
echo "src/"
echo "├── commands/           # CLI command implementations"
echo "├── models/             # MongoDB schemas"
echo "├── types/              # TypeScript type definitions"
echo "├── utils/              # Utility functions"
echo "├── db.ts               # Database connection"
echo "└── app.ts              # Main CLI application"
echo ""

# Show next steps
echo "🎯 Next Steps:"
echo "-------------"
echo "1. Start MongoDB:"
echo "   sudo systemctl start mongod"
echo ""
echo "2. Configure environment:"
echo "   cp env.example .env"
echo "   # Edit .env with your settings"
echo ""
echo "3. Test the application:"
echo "   npm run dev status"
echo "   npm run dev ingest-namaste sample-namaste.csv"
echo "   npm run dev fetch-icd 'digestion' --type both"
echo "   npm run dev search 'digestion'"
echo ""
echo "4. Build for production:"
echo "   npm run build"
echo "   npm start"
echo ""

echo "🎉 Demo completed! The NAMASTE-ICD CLI is ready to use."
echo ""
echo "💡 For more information, check the README.md file."
