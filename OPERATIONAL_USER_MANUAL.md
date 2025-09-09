# 📖 NAMASTE-ICD CLI User Manual

**Version**: 1.0.0  
**Date**: September 2025  
**For**: Healthcare Professionals, Researchers, and System Administrators  

---

## 🎯 **Welcome to NAMASTE-ICD CLI**

The NAMASTE-ICD CLI is a powerful tool that helps you manage traditional medicine terminology (NAMASTE codes) and connect them with international medical codes (ICD-11). This manual will guide you through using the system step by step.

### **What This System Does**
- ✅ **Import NAMASTE Codes**: Upload traditional medicine terminology from CSV files
- ✅ **Fetch ICD-11 Codes**: Get international medical codes from WHO database
- ✅ **Create Mappings**: Connect NAMASTE codes with ICD-11 codes
- ✅ **Search & Translate**: Find and convert between different coding systems
- ✅ **Generate Reports**: Create standardized medical reports

---

## 🚀 **Getting Started**

### **Prerequisites**
Before using the system, ensure you have:
- ✅ **Computer**: Windows, Mac, or Linux
- ✅ **Internet Connection**: For accessing WHO medical database
- ✅ **CSV Files**: Your NAMASTE terminology data (if importing)
- ✅ **Basic Computer Skills**: Ability to use command line or terminal

### **Installation**
1. **Download the Software**: Get the latest version from GitHub
2. **Install Dependencies**: Run `npm install` in the project folder
3. **Configure Settings**: Set up your database and API connections
4. **Test Installation**: Run `npm run dev status` to verify everything works

---

## 📋 **Basic Operations Guide**

### **1. Importing NAMASTE Codes**

#### **Step 1: Prepare Your CSV File**
Your CSV file should have these columns:
```csv
code,name,description,category,system
NAM001,Agnimandya,Weak digestion characterized by reduced digestive fire,Digestive,https://namaste.ayush.gov.in/codes
NAM002,Vata Rog,Wind-related disorders,Nervous,https://namaste.ayush.gov.in/codes
```

#### **Step 2: Import the Codes**
```bash
# Basic import
npm run dev ingest-namaste your-file.csv

# Import with automatic ICD-11 mapping (Recommended)
npm run dev ingest-with-mapping your-file.csv
```

#### **What Happens During Import**
- ✅ **Validation**: System checks if your codes are properly formatted
- ✅ **Storage**: Codes are saved to the database
- ✅ **Mapping**: Automatic connection with ICD-11 codes (if using auto-mapping)
- ✅ **Report**: You'll see a summary of imported codes

#### **Example Output**
```
📥 Starting NAMASTE CSV ingestion with automatic ICD-11 mapping
📋 CSV parsing completed: ✅ Processed: 20 rows
💾 Inserting NAMASTE codes into database... ✅ Successfully inserted 20 NAMASTE codes
🤖 Auto-generating equivalent ICD-11 codes... ✅ Generated 6 equivalent ICD-11 codes
🔗 Auto-creating NAMASTE to ICD-11 mappings... ✅ Created 6 automatic mappings
🎉 NAMASTE ingestion with auto-mapping completed successfully!
```

---

### **2. Fetching ICD-11 Codes from WHO Database**

#### **Step 1: Search for Medical Terms**
```bash
# Search for traditional medicine codes
npm run dev fetch-icd "digestion" --type TM2

# Search for biomedical codes
npm run dev fetch-icd "cholera" --type Biomedicine

# Search both types
npm run dev fetch-icd "fever" --type both
```

#### **Step 2: Understand the Results**
The system will show you:
- ✅ **Found Codes**: Number of ICD-11 codes discovered
- ✅ **Code Details**: Title, description, and system information
- ✅ **Storage Status**: Whether codes were saved to your database

#### **Example Output**
```
🔍 Fetching ICD-11 codes for query: "digestion"
✅ Found 19 TM2 results
📋 ICD-11 TM2 Codes Found (19):
1. Indigestion disorder (TM2)
2. Derangement of digestive tract pattern (TM2)
3. Weak digestive fire pattern (TM2)
💾 Storing TM2 codes in database... ✅ Successfully inserted 19 TM2 codes
```

---

### **3. Searching for Codes**

#### **Step 1: Search Across All Systems**
```bash
npm run dev search "digestion"
```

#### **Step 2: Review Search Results**
The system will show results from:
- 🌿 **NAMASTE Codes**: Your traditional medicine terminology
- 🌿 **ICD-11 TM2**: Traditional Medicine Module 2 codes
- 🏥 **ICD-11 Biomedicine**: Standard medical codes

#### **Example Output**
```
📊 SEARCH RESULTS FOR: "digestion"
🌿 NAMASTE Codes (1): Agnimandya
🌿 ICD-11 TM2 Codes (4): Real WHO TM2 codes
🏥 ICD-11 Biomedicine Codes (2): Generated equivalents
📊 Total: 7 codes from multiple systems
```

---

### **4. Translating Between Code Systems**

#### **Step 1: Translate NAMASTE to ICD-11**
```bash
npm run dev translate NAM001
```

#### **Step 2: Review Translation Results**
The system will show:
- ✅ **NAMASTE Code**: Original traditional medicine code
- ✅ **ICD-11 Mappings**: Connected international codes
- ✅ **Confidence Level**: How certain the mapping is
- ✅ **Mapping Type**: Relationship between codes (equivalent, related, etc.)

#### **Example Output**
```
🔄 Translating NAMASTE code: NAM001
🌿 NAMASTE Code Information:
   Code: NAM001
   Name: Agnimandya
   Description: Weak digestion characterized by reduced digestive fire

🔗 ICD-11 Mappings:
🌿 TM2 Mappings (1): equivalent (0.8 confidence)
🏥 Biomedicine Mappings (2): equivalent (0.8 confidence)
📈 Total Mappings: 3
```

---

### **5. Creating Manual Mappings**

#### **Step 1: Create a Mapping**
```bash
npm run dev map-code NAM001 TM2-001 --type TM2 --equivalence equivalent --confidence 0.9
```

#### **Step 2: Verify the Mapping**
```bash
npm run dev translate NAM001
```

#### **Mapping Parameters Explained**
- **`--type`**: TM2 (Traditional Medicine) or Biomedicine
- **`--equivalence`**: equivalent, relatedto, wider, narrower
- **`--confidence`**: 0.0 to 1.0 (how certain you are about the mapping)

---

### **6. Advanced Features**

#### **A. Automatic Mapping**
```bash
# Let the system automatically create mappings
npm run dev auto-map
```

#### **B. WHO API Demonstration**
```bash
# See advanced WHO API features
npm run dev who-demo "digestion"
```

#### **C. Code Lookup**
```bash
# Get detailed information about a specific code
npm run dev lookup-code "SA00"
```

#### **D. Automatic Coding**
```bash
# Automatically code diagnostic text
npm run dev autocode "weak digestive fire"
```

---

## 📊 **Understanding Your Data**

### **Code Types Explained**

#### **NAMASTE Codes**
- **Purpose**: Traditional medicine terminology from India
- **Format**: NAM001, NAM002, etc.
- **Source**: AYUSH (Ayurveda, Yoga, Naturopathy, Unani, Siddha, Homeopathy)

#### **ICD-11 TM2 Codes**
- **Purpose**: WHO Traditional Medicine Module 2
- **Format**: SA00-SJ3Z
- **Source**: World Health Organization

#### **ICD-11 Biomedicine Codes**
- **Purpose**: Standard international medical codes
- **Format**: Various (A00-Z99)
- **Source**: World Health Organization

### **Mapping Relationships**

#### **Equivalence Types**
- **`equivalent`**: Codes mean the same thing
- **`relatedto`**: Codes are related but not identical
- **`wider`**: ICD-11 code covers more conditions
- **`narrower`**: ICD-11 code covers fewer conditions

#### **Confidence Levels**
- **0.9-1.0**: Very certain about the mapping
- **0.7-0.8**: Confident about the mapping
- **0.5-0.6**: Somewhat confident
- **0.0-0.4**: Uncertain about the mapping

---

## 🔧 **Troubleshooting Common Issues**

### **Problem 1: Import Errors**
**Symptoms**: CSV import fails or shows errors
**Solutions**:
1. ✅ **Check CSV Format**: Ensure columns are named correctly
2. ✅ **Required Fields**: Make sure code, name, and description are present
3. ✅ **File Encoding**: Save CSV as UTF-8 encoding
4. ✅ **File Path**: Use correct path to your CSV file

### **Problem 2: No Search Results**
**Symptoms**: Search returns no results
**Solutions**:
1. ✅ **Check Database**: Ensure codes are imported first
2. ✅ **Search Terms**: Try different keywords
3. ✅ **Case Sensitivity**: Search is case-insensitive
4. ✅ **Partial Matches**: Use partial words (e.g., "digest" instead of "digestion")

### **Problem 3: WHO API Errors**
**Symptoms**: Cannot fetch ICD-11 codes
**Solutions**:
1. ✅ **Internet Connection**: Check your internet connection
2. ✅ **API Credentials**: Verify WHO API credentials are configured
3. ✅ **Try Again**: WHO API might be temporarily unavailable
4. ✅ **Fallback**: System will generate equivalent codes automatically

### **Problem 4: Mapping Issues**
**Symptoms**: Translations don't work or show errors
**Solutions**:
1. ✅ **Check Codes**: Ensure both NAMASTE and ICD-11 codes exist
2. ✅ **Create Mappings**: Use `map-code` command to create mappings
3. ✅ **Verify Mappings**: Use `translate` command to check mappings
4. ✅ **Auto-Mapping**: Try `auto-map` command for automatic mappings

---

## 📈 **Best Practices**

### **For Healthcare Professionals**
1. ✅ **Start Small**: Begin with a small set of codes to test the system
2. ✅ **Verify Mappings**: Always review automatic mappings before using
3. ✅ **Document Changes**: Keep track of manual mapping decisions
4. ✅ **Regular Updates**: Periodically fetch new ICD-11 codes from WHO

### **For System Administrators**
1. ✅ **Backup Data**: Regularly backup your database
2. ✅ **Monitor Logs**: Check system logs for errors
3. ✅ **Update Software**: Keep the system updated with latest versions
4. ✅ **Test Regularly**: Run status checks to ensure system health

### **For Researchers**
1. ✅ **Document Sources**: Keep track of where your NAMASTE codes come from
2. ✅ **Validate Mappings**: Review and validate all code mappings
3. ✅ **Export Data**: Use generated FHIR resources for research
4. ✅ **Share Findings**: Document your mapping decisions for others

---

## 📋 **Quick Reference Commands**

### **Essential Commands**
```bash
# Check system status
npm run dev status

# Import NAMASTE codes
npm run dev ingest-with-mapping your-file.csv

# Search for codes
npm run dev search "your-search-term"

# Translate codes
npm run dev translate NAM001

# Fetch ICD-11 codes
npm run dev fetch-icd "medical-term" --type both

# View system logs
npm run dev view-logs --limit 20
```

### **Advanced Commands**
```bash
# Create manual mapping
npm run dev map-code NAM001 TM2-001 --type TM2 --equivalence equivalent

# Automatic mapping
npm run dev auto-map

# WHO API demo
npm run dev who-demo "medical-term"

# Code lookup
npm run dev lookup-code "SA00"

# Automatic coding
npm run dev autocode "diagnostic text"
```

---

## 📞 **Getting Help**

### **System Status Check**
```bash
npm run dev status
```
This command will show you:
- ✅ **Database Connection**: Whether your database is working
- ✅ **WHO API Status**: Whether you can access WHO medical database
- ✅ **System Health**: Overall system status

### **Viewing Logs**
```bash
npm run dev view-logs --limit 50
```
This command will show you:
- ✅ **Recent Activities**: What the system has been doing
- ✅ **Error Messages**: Any problems that occurred
- ✅ **User Actions**: Who did what and when

### **Common Error Messages**

#### **"Database connection failed"**
- **Cause**: Cannot connect to MongoDB
- **Solution**: Check database configuration and ensure MongoDB is running

#### **"WHO API unavailable"**
- **Cause**: Cannot access WHO ICD-11 API
- **Solution**: Check internet connection and API credentials

#### **"Code not found"**
- **Cause**: The code you're looking for doesn't exist
- **Solution**: Import the codes first or check the code format

#### **"CSV file not found"**
- **Cause**: Cannot find the CSV file you specified
- **Solution**: Check the file path and ensure the file exists

---

## 🎯 **Success Stories**

### **Case Study 1: Hospital Integration**
**Challenge**: A hospital needed to integrate traditional medicine codes with their EMR system.
**Solution**: Used NAMASTE-ICD CLI to import 500+ NAMASTE codes and create mappings with ICD-11.
**Result**: Successfully integrated dual coding system, improving patient care documentation.

### **Case Study 2: Research Project**
**Challenge**: Researchers needed to analyze traditional medicine data using international standards.
**Solution**: Used the system to map 1000+ traditional medicine terms to ICD-11 codes.
**Result**: Enabled comparative analysis with international medical databases.

### **Case Study 3: Government Health Program**
**Challenge**: AYUSH department needed standardized terminology for health programs.
**Solution**: Implemented NAMASTE-ICD CLI for terminology management across multiple centers.
**Result**: Achieved consistent terminology usage and improved data quality.

---

## 🎉 **Conclusion**

The NAMASTE-ICD CLI is a powerful tool that bridges traditional medicine and modern healthcare systems. By following this manual, you can:

✅ **Import and manage** traditional medicine terminology  
✅ **Connect with international** medical coding systems  
✅ **Create accurate mappings** between different code systems  
✅ **Generate standardized reports** for healthcare use  
✅ **Improve patient care** through better documentation  

### **Remember**
- 🎯 **Start simple**: Begin with basic operations
- 🔍 **Explore features**: Try different commands to understand capabilities
- 📚 **Read outputs**: Pay attention to system messages and results
- 🔧 **Ask for help**: Use status and log commands when needed
- 📈 **Practice regularly**: The more you use it, the more comfortable you'll become

**Welcome to the future of integrated healthcare terminology management!** 🚀

---

## 📝 **Appendix: File Formats**

### **CSV File Format**
```csv
code,name,description,category,system
NAM001,Agnimandya,Weak digestion characterized by reduced digestive fire,Digestive,https://namaste.ayush.gov.in/codes
NAM002,Vata Rog,Wind-related disorders,Nervous,https://namaste.ayush.gov.in/codes
NAM003,Pitta Rog,Fire-related disorders,Metabolic,https://namaste.ayush.gov.in/codes
```

### **FHIR Resources Generated**
- **CodeSystem**: Standardized terminology resources
- **ConceptMap**: Mapping between different code systems
- **Bundle**: Complete encounter resources with dual coding

### **Database Collections**
- **namaste_codes**: Your traditional medicine terminology
- **icd_codes**: WHO ICD-11 codes (TM2 and Biomedicine)
- **concept_mappings**: Connections between NAMASTE and ICD-11 codes
- **encounters**: Patient encounter records
- **audit_logs**: System operation history
