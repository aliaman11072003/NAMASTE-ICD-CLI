# 🏗️ NAMASTE-ICD Terminology Microservice

**Service Type**: Healthcare Terminology Microservice  
**Domain**: AYUSH (Ayurveda, Yoga, Naturopathy, Unani, Siddha, Homeopathy) Healthcare  
**Compliance**: FHIR R4, WHO ICD-11, India EHR Standards 2016  

---

## 🎯 **Microservice Overview**

The NAMASTE-ICD CLI is a **specialized healthcare terminology microservice** that provides:

- **NAMASTE Code Management**: Import, validate, and manage AYUSH terminology
- **ICD-11 Integration**: Real-time WHO ICD-11 API integration (TM2 + Biomedicine)
- **Terminology Mapping**: Automatic and manual NAMASTE ↔ ICD-11 mapping
- **FHIR Compliance**: Generate FHIR R4 CodeSystem and ConceptMap resources
- **Dual Coding Support**: Enable traditional medicine + biomedical coding

---

## 🏗️ **Microservice Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    NAMASTE-ICD MICROSERVICE                 │
├─────────────────────────────────────────────────────────────┤
│  CLI Interface Layer                                        │
│  ├── ingest-namaste     ├── fetch-icd      ├── search      │
│  ├── ingest-with-mapping├── map-code       ├── translate    │
│  ├── who-demo          ├── lookup-code    ├── autocode     │
│  └── upload-encounter  ├── auto-map       └── view-logs    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── NAMASTE Processing    ├── ICD-11 Integration          │
│  ├── Mapping Algorithms    ├── FHIR Generation             │
│  └── Audit & Logging       └── Error Handling              │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                          │
│  ├── MongoDB (Terminology) ├── WHO ICD-11 API              │
│  ├── NAMASTE Codes         ├── ICD-11 Codes                │
│  ├── Concept Mappings      └── Audit Logs                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Microservice Components**

### **1. API Gateway Layer** ✅
- **CLI Interface**: Command-line interface for service interaction
- **RESTful Commands**: Each CLI command represents a service endpoint
- **Authentication**: OAuth 2.0 integration with WHO ICD-11 API
- **Rate Limiting**: Built-in API rate limiting and retry logic

### **2. Business Logic Layer** ✅
- **Terminology Processing**: NAMASTE code ingestion and validation
- **Mapping Services**: Automatic and manual code mapping algorithms
- **FHIR Generation**: CodeSystem and ConceptMap resource creation
- **Integration Services**: WHO ICD-11 API integration and data processing

### **3. Data Layer** ✅
- **MongoDB**: Primary data store for terminology and mappings
- **WHO ICD-11 API**: External API for real-time ICD-11 data
- **File Storage**: CSV import/export and FHIR resource generation
- **Audit Trail**: Complete operation logging and compliance tracking

---

## 🌐 **Service Interfaces**

### **Primary Interface: CLI Commands**
```bash
# Data Ingestion
namaste-icd ingest-namaste <csv-file>
namaste-icd ingest-with-mapping <csv-file>

# External API Integration
namaste-icd fetch-icd <query> --type <TM2|Biomedicine|both>

# Terminology Services
namaste-icd search <term>
namaste-icd translate <namaste-code>
namaste-icd map-code <namaste> <icd> --type <TM2|Biomedicine>

# Advanced API Features
namaste-icd who-demo <term>
namaste-icd lookup-code <code>
namaste-icd autocode <text>

# System Operations
namaste-icd status
namaste-icd view-logs
```

### **Secondary Interface: Generated Resources**
- **FHIR CodeSystem**: NAMASTE and ICD-11 terminology resources
- **FHIR ConceptMap**: NAMASTE ↔ ICD-11 mapping resources
- **FHIR Bundle**: Complete encounter resources with dual coding

---

## 🔌 **External Dependencies**

### **WHO ICD-11 API** ✅
- **Endpoint**: `https://id.who.int/icd/`
- **Authentication**: OAuth 2.0 Client Credentials
- **Data**: Real-time ICD-11 TM2 and Biomedicine codes
- **Rate Limiting**: Built-in retry and fallback mechanisms

### **MongoDB** ✅
- **Purpose**: Terminology storage and mapping persistence
- **Collections**: namaste_codes, icd_codes, concept_mappings, encounters, audit_logs
- **Indexing**: Optimized for search and mapping operations

---

## 📊 **Service Capabilities**

### **Core Terminology Services** ✅
1. **NAMASTE Code Management**
   - CSV import and validation
   - Code deduplication and normalization
   - Category and system management

2. **ICD-11 Integration**
   - Real-time WHO API integration
   - TM2 (Traditional Medicine Module 2) support
   - Biomedicine code retrieval
   - Chapter 26 filtering for traditional medicine

3. **Mapping Services**
   - Automatic text-based mapping
   - Manual mapping with confidence scoring
   - Equivalence relationship management
   - Mapping validation and verification

4. **FHIR Compliance**
   - CodeSystem resource generation
   - ConceptMap resource creation
   - Bundle resource assembly
   - Metadata and versioning

### **Advanced Features** ✅
1. **Auto-coding**: Automatic diagnostic text coding
2. **Code Lookup**: Detailed code information retrieval
3. **Foundation Mapping**: Foundation to linearization mapping
4. **Audit Trail**: Complete operation logging
5. **Error Handling**: Graceful degradation and fallback

---

## 🚀 **Deployment Architecture**

### **Standalone Deployment** ✅
```bash
# Direct deployment
npm install
npm run build
npm start

# Docker deployment (recommended)
docker build -t namaste-icd-microservice .
docker run -p 3000:3000 namaste-icd-microservice
```

### **Container Orchestration** ✅
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: namaste-icd-microservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: namaste-icd-microservice
  template:
    metadata:
      labels:
        app: namaste-icd-microservice
    spec:
      containers:
      - name: namaste-icd
        image: namaste-icd-microservice:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          value: "mongodb://mongo:27017/namaste-icd"
        - name: WHO_API_BASE_URL
          value: "https://id.who.int/icd"
```

---

## 🔒 **Security & Compliance**

### **Authentication & Authorization** ✅
- **OAuth 2.0**: WHO ICD-11 API authentication
- **Token Management**: Secure token storage and refresh
- **API Security**: HTTPS enforcement and header validation

### **Data Privacy & Compliance** ✅
- **FHIR R4**: Healthcare interoperability standard
- **India EHR Standards 2016**: Compliance with national standards
- **Audit Logging**: Complete operation tracking
- **Data Encryption**: Secure data transmission and storage

---

## 📈 **Scalability & Performance**

### **Horizontal Scaling** ✅
- **Stateless Design**: Each operation is independent
- **Load Balancing**: Multiple service instances
- **Database Sharding**: MongoDB horizontal scaling
- **API Rate Limiting**: WHO API quota management

### **Performance Optimization** ✅
- **Caching**: Token and response caching
- **Database Indexing**: Optimized query performance
- **Async Operations**: Non-blocking API calls
- **Batch Processing**: Efficient bulk operations

---

## 🎯 **Use Cases**

### **Primary Use Cases** ✅
1. **AYUSH Healthcare Systems**: Traditional medicine terminology management
2. **EMR Integration**: FHIR-compliant terminology services
3. **Research Applications**: NAMASTE-ICD-11 mapping research
4. **Compliance Systems**: India EHR Standards compliance

### **Integration Scenarios** ✅
1. **Hospital Information Systems**: Terminology lookup and mapping
2. **Clinical Decision Support**: Automated coding assistance
3. **Health Data Analytics**: Standardized terminology for analysis
4. **Interoperability**: FHIR-based data exchange

---

## 🏆 **Microservice Benefits**

### **For Healthcare Organizations** ✅
- **Specialized Service**: Focused on terminology needs
- **FHIR Compliance**: Standard healthcare interoperability
- **Real-time Data**: Live WHO ICD-11 integration
- **Dual Coding**: Traditional + biomedical medicine support

### **For Developers** ✅
- **Independent Deployment**: Deploy without affecting other services
- **Clear API**: Well-defined CLI interface
- **Comprehensive Documentation**: Complete implementation guides
- **Production Ready**: Error handling, logging, and monitoring

### **For System Integration** ✅
- **API-First Design**: Easy integration with other services
- **Standard Formats**: FHIR R4 compliance
- **Flexible Deployment**: Standalone or containerized
- **Scalable Architecture**: Horizontal scaling support

---

## 🎉 **Conclusion**

The NAMASTE-ICD CLI is a **production-ready healthcare terminology microservice** that provides:

✅ **Specialized Functionality**: NAMASTE-ICD-11 terminology services  
✅ **Microservice Architecture**: Independent, scalable, and maintainable  
✅ **Healthcare Compliance**: FHIR R4 and India EHR Standards 2016  
✅ **Real-time Integration**: Live WHO ICD-11 API connectivity  
✅ **Production Quality**: Error handling, logging, and monitoring  

**This is a perfect example of a domain-specific microservice that solves a real healthcare problem with modern architecture principles!** 🚀
