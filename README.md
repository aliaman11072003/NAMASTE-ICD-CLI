# 🌿 NAMASTE-ICD CLI

A **Node.js CLI application** for integrating NAMASTE (National AYUSH Morbidity & Standardized Terminologies Electronic) and ICD-11 (Traditional Medicine Module 2 + Biomedicine) into EMR systems, compliant with India's 2016 EHR Standards.

## 🎯 Problem Statement

India's Ayush sector is rapidly transitioning from paper-based records to interoperable digital health systems. This CLI tool addresses the need to harmonize:

- **NAMASTE codes**: Over 4,500 standardized terms for Ayurveda, Siddha, and Unani disorders
- **ICD-11 TM2**: WHO's Traditional Medicine Module 2 with 529 disorder categories and 196 pattern codes
- **ICD-11 Biomedicine**: Standard international disease classification

This integration enables accurate clinical documentation, decision support, and compliance with India's EHR Standards mandating FHIR R4 APIs, SNOMED CT semantics, and robust audit trails.

## ✨ Features

- **📥 CSV Import**: Ingest NAMASTE codes from CSV files
- **🌐 WHO API Integration**: Fetch ICD-11 codes from WHO's official API
- **🔗 Concept Mapping**: Create mappings between NAMASTE and ICD-11 codes
- **🔍 Smart Search**: Search across both code systems simultaneously
- **🔄 Translation**: Show ICD-11 equivalents for NAMASTE codes
- **📤 FHIR Support**: Upload and process FHIR Encounter resources
- **📊 Audit Logging**: Comprehensive audit trail for all operations
- **🏥 Dual Coding**: Support for both traditional medicine and biomedicine codes

## 🛠️ Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ORM
- **CLI Framework**: Commander.js
- **CSV Parsing**: csv-parser
- **HTTP Client**: Axios
- **FHIR**: Custom TypeScript models (FHIR R4 compliant)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd namaste-icd-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB connection and WHO API settings
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Database Setup

1. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Verify connection**
   ```bash
   npm run dev status
   ```

## 📖 Usage

### Basic Commands

```bash
# Check system status
npm run dev status

# Ingest NAMASTE codes from CSV
npm run dev ingest-namaste namaste.csv

# Fetch ICD-11 codes from WHO API
npm run dev fetch-icd "digestion" --type both

# Create code mappings
npm run dev map-code NAM123 ICD456 --type TM2

# Search across both systems
npm run dev search "digestion"

# Translate NAMASTE to ICD-11
npm run dev translate NAM123

# Upload FHIR encounter
npm run dev upload-encounter encounter.json

# View audit logs
npm run dev view-logs --limit 20
```

### Command Options

#### `ingest-namaste <csv-file>`
- `-u, --user <user>`: User performing the action (default: system)

#### `fetch-icd <query>`
- `-t, --type <type>`: ICD type (TM2, Biomedicine, or both)
- `-u, --user <user>`: User performing the action

#### `map-code <namaste-code> <icd-code>`
- `-t, --type <type>`: ICD type (TM2 or Biomedicine)
- `-e, --equivalence <equivalence>`: Equivalence relationship
- `-c, --confidence <confidence>`: Confidence level (0-1)
- `-u, --user <user>`: User performing the action

#### `search <query>`
- `-u, --user <user>`: User performing the action

#### `translate <namaste-code>`
- `-u, --user <user>`: User performing the action

#### `upload-encounter <json-file>`
- `-u, --user <user>`: User performing the action

#### `view-logs`
- `-l, --limit <limit>`: Number of logs to show
- `-u, --user <user>`: Filter by user
- `-a, --action <action>`: Filter by action

## 📁 Project Structure

```
src/
├── commands/           # CLI command implementations
│   ├── ingestNAMASTE.ts
│   ├── fetchICD.ts
│   ├── mapCode.ts
│   ├── search.ts
│   ├── translate.ts
│   ├── uploadEncounter.ts
│   └── viewLogs.ts
├── models/             # MongoDB schemas
│   ├── NAMASTECode.ts
│   ├── ICDCode.ts
│   ├── ConceptMap.ts
│   ├── Encounter.ts
│   ├── AuditLog.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── auditLogger.ts
│   ├── fhirUtils.ts
│   └── whoApi.ts
├── db.ts               # Database connection
└── app.ts              # Main CLI application
```

## 🗄️ Database Collections

- **`namaste_codes`**: NAMASTE terminology codes
- **`icd_codes`**: ICD-11 codes (TM2 + Biomedicine)
- **`concept_map`**: Mappings between NAMASTE and ICD-11
- **`encounters`**: Patient encounter records with dual coding
- **`audit_logs`**: Comprehensive audit trail

## 🔧 FHIR Compliance

The application generates FHIR R4 compliant resources:

- **CodeSystem**: For both NAMASTE and ICD-11 codes
- **ConceptMap**: For NAMASTE ↔ ICD-11 mappings
- **Encounter**: For patient encounters with dual coding
- **Bundle**: For packaging multiple resources

## 📊 Sample Data

### NAMASTE CSV Format
```csv
code,name,description,category
NAM001,Agnimandya,Weak digestion,Digestive
NAM002,Vata Rog,Wind disorder,General
```

### FHIR Encounter JSON
```json
{
  "resourceType": "Encounter",
  "id": "enc-001",
  "status": "finished",
  "subject": {
    "reference": "Patient/patient-001"
  },
  "diagnosis": [
    {
      "condition": {
        "coding": [
          {
            "system": "https://namaste.ayush.gov.in/codes",
            "code": "NAM001",
            "display": "Agnimandya"
          },
          {
            "system": "https://icd.who.int/icdapi/TM2",
            "code": "TM2-001",
            "display": "Disorder of digestion"
          }
        ]
      }
    }
  ]
}
```

## 🚀 Development

### Scripts

```bash
# Development mode
npm run dev

# Build project
npm run build

# Start production
npm start

# Watch mode
npm run watch
```

### Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/namaste_icd_db

# WHO API
WHO_API_BASE_URL=https://id.who.int/icd/release/11/2023
WHO_API_TIMEOUT=10000

# Application
NODE_ENV=development
LOG_LEVEL=info

# FHIR
FHIR_VERSION=R4
FHIR_BASE_URL=http://localhost:3000/fhir
```

## 🧪 Testing

### Sample Workflow

1. **Ingest NAMASTE codes**
   ```bash
   npm run dev ingest-namaste sample-namaste.csv
   ```

2. **Fetch ICD-11 codes**
   ```bash
   npm run dev fetch-icd "digestion" --type both
   ```

3. **Create mappings**
   ```bash
   npm run dev map-code NAM001 TM2-001 --type TM2
   npm run dev map-code NAM001 BD001 --type Biomedicine
   ```

4. **Search and translate**
   ```bash
   npm run dev search "digestion"
   npm run dev translate NAM001
   ```

5. **Upload encounter**
   ```bash
   npm run dev upload-encounter sample-encounter.json
   ```

6. **View audit trail**
   ```bash
   npm run dev view-logs
   ```

## 🔒 Security & Compliance

- **Audit Logging**: Every action is logged with user, timestamp, and details
- **Data Validation**: Input validation for all commands
- **Error Handling**: Comprehensive error handling and logging
- **FHIR Compliance**: Adheres to FHIR R4 standards
- **EHR Standards**: Compliant with India's 2016 EHR Standards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Ministry of AYUSH, Government of India** for NAMASTE terminologies
- **World Health Organization** for ICD-11 standards
- **FHIR community** for healthcare interoperability standards

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the audit logs for troubleshooting

---

**Built with ❤️ for India's Digital Health Mission**
