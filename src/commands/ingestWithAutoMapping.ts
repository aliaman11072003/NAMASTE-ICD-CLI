import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { NAMASTECode, ICDCode, ConceptMap } from '../models';
import { NAMASTECode as INAMASTECode } from '../types';
import { FHIRUtils } from '../utils/fhirUtils';
import auditLogger from '../utils/auditLogger';

export async function ingestWithAutoMapping(csvFile: string): Promise<void> {
  console.log(`📥 Starting NAMASTE CSV ingestion with automatic ICD-11 mapping from: ${csvFile}`);

  // Check if file exists
  if (!fs.existsSync(csvFile)) {
    throw new Error(`CSV file not found: ${csvFile}`);
  }

  const results: INAMASTECode[] = [];
  let processedCount = 0;
  let skippedCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data: any) => {
        try {
          // Validate required fields
          if (!data.code || !data.name || !data.description) {
            console.log(`⚠️ Skipping row with missing required fields: ${JSON.stringify(data)}`);
            skippedCount++;
            return;
          }

          // Create NAMASTE code object
          const namasteCode: Partial<INAMASTECode> = {
            code: data.code.trim(),
            name: data.name.trim(),
            description: data.description.trim(),
            category: data.category?.trim(),
            system: data.system?.trim() || 'https://namaste.ayush.gov.in/codes'
          };

          results.push(namasteCode as INAMASTECode);
          processedCount++;

          if (processedCount % 100 === 0) {
            console.log(`📊 Processed ${processedCount} rows...`);
          }
        } catch (error) {
          console.log(`⚠️ Error processing row: ${error}`);
          skippedCount++;
        }
      })
      .on('end', async () => {
        try {
          console.log(`\n📋 CSV parsing completed:`);
          console.log(`   ✅ Processed: ${processedCount} rows`);
          console.log(`   ⚠️ Skipped: ${skippedCount} rows`);

          if (results.length === 0) {
            throw new Error('No valid NAMASTE codes found in CSV file');
          }

          // Insert NAMASTE codes into database
          console.log('\n💾 Inserting NAMASTE codes into database...');
          const insertedCodes = await NAMASTECode.insertMany(results, { ordered: false });
          console.log(`✅ Successfully inserted ${insertedCodes.length} NAMASTE codes`);

          // Generate FHIR CodeSystem for NAMASTE
          console.log('\n🔧 Generating FHIR CodeSystem for NAMASTE...');
          const fhirCodeSystem = FHIRUtils.generateNAMASTECodeSystem(results);
          const outputFile = path.join(process.cwd(), 'namaste-codesystem.json');
          fs.writeFileSync(outputFile, JSON.stringify(fhirCodeSystem, null, 2));
          console.log(`💾 FHIR CodeSystem saved to: ${outputFile}`);

          // Auto-generate equivalent ICD codes
          console.log('\n🤖 Auto-generating equivalent ICD-11 codes...');
          const generatedICDCodes = await generateEquivalentICDCodes(results);
          console.log(`✅ Generated ${generatedICDCodes.length} equivalent ICD-11 codes`);

          // Auto-create mappings
          console.log('\n🔗 Auto-creating NAMASTE to ICD-11 mappings...');
          const mappingsCreated = await createAutoMappings(results, generatedICDCodes);
          console.log(`✅ Created ${mappingsCreated} automatic mappings`);

          // Generate FHIR ConceptMap
          if (mappingsCreated > 0) {
            console.log('\n🔧 Generating FHIR ConceptMap...');
            const allMappings = await ConceptMap.find();
            const fhirConceptMap = FHIRUtils.generateConceptMap(allMappings as any[]);
            const conceptMapFile = path.join(process.cwd(), 'namaste-icd-conceptmap.json');
            fs.writeFileSync(conceptMapFile, JSON.stringify(fhirConceptMap, null, 2));
            console.log(`💾 FHIR ConceptMap saved to: ${conceptMapFile}`);
          }

          // Log audit trail
          await auditLogger.logIngest('namaste_codes_with_auto_mapping', insertedCodes.length, csvFile);

          console.log('\n🎉 NAMASTE ingestion with auto-mapping completed successfully!');
          console.log(`📊 Total NAMASTE codes: ${await NAMASTECode.countDocuments()}`);
          console.log(`📊 Total ICD codes: ${await ICDCode.countDocuments()}`);
          console.log(`📊 Total mappings: ${await ConceptMap.countDocuments()}`);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(new Error(`Error reading CSV file: ${error.message}`));
      });
  });
}

async function generateEquivalentICDCodes(namasteCodes: INAMASTECode[]): Promise<any[]> {
  const generatedCodes: any[] = [];
  
  for (const namasteCode of namasteCodes) {
    // Generate equivalent ICD codes based on NAMASTE content
    const equivalentCodes = generateICDCodesFromNAMASTE(namasteCode);
    
    for (const icdCode of equivalentCodes) {
      // Check if code already exists
      const existing = await ICDCode.findOne({ code: icdCode.code, type: icdCode.type });
      if (!existing) {
        try {
          const inserted = await ICDCode.create(icdCode);
          generatedCodes.push(inserted);
        } catch (error) {
          console.log(`⚠️ Could not insert ICD code ${icdCode.code}: ${error}`);
        }
      }
    }
  }
  
  return generatedCodes;
}

function generateICDCodesFromNAMASTE(namasteCode: INAMASTECode): any[] {
  const codes: any[] = [];
  const text = `${namasteCode.name} ${namasteCode.description}`.toLowerCase();
  
  // Generate TM2 codes based on NAMASTE content
  if (text.includes('digestion') || text.includes('agni') || text.includes('digestive')) {
    codes.push({
      code: `TM2-${namasteCode.code.replace('NAM', '')}`,
      title: `Traditional Medicine: ${namasteCode.name}`,
      type: 'TM2',
      description: `Traditional medicine equivalent of ${namasteCode.description}`,
      system: 'https://icd.who.int/icdapi/TM2',
      version: '11'
    });
  }
  
  // Generate Biomedicine codes based on NAMASTE content
  if (text.includes('digestion') || text.includes('digestive')) {
    codes.push({
      code: `BD-${namasteCode.code.replace('NAM', '')}`,
      title: `Biomedical: ${namasteCode.name}`,
      type: 'Biomedicine',
      description: `Biomedical equivalent of ${namasteCode.description}`,
      system: 'https://icd.who.int/icdapi/Biomedicine',
      version: '11'
    });
  }
  
  if (text.includes('vata') || text.includes('wind') || text.includes('nervous')) {
    codes.push({
      code: `BD-${namasteCode.code.replace('NAM', '')}-N`,
      title: `Neurological: ${namasteCode.name}`,
      type: 'Biomedicine',
      description: `Neurological equivalent of ${namasteCode.description}`,
      system: 'https://icd.who.int/icdapi/Biomedicine',
      version: '11'
    });
  }
  
  if (text.includes('pitta') || text.includes('fire') || text.includes('inflammation')) {
    codes.push({
      code: `BD-${namasteCode.code.replace('NAM', '')}-I`,
      title: `Inflammatory: ${namasteCode.name}`,
      type: 'Biomedicine',
      description: `Inflammatory equivalent of ${namasteCode.description}`,
      system: 'https://icd.who.int/icdapi/Biomedicine',
      version: '11'
    });
  }
  
  return codes;
}

async function createAutoMappings(namasteCodes: INAMASTECode[], icdCodes: any[]): Promise<number> {
  let mappingsCreated = 0;
  
  for (const namasteCode of namasteCodes) {
    // Find related ICD codes
    const relatedICDCodes = icdCodes.filter(icd => 
      icd.code.includes(namasteCode.code.replace('NAM', ''))
    );
    
    for (const icdCode of relatedICDCodes) {
      // Check if mapping already exists
      const existing = await ConceptMap.findOne({
        namasteCode: namasteCode.code,
        icdCode: icdCode.code,
        icdType: icdCode.type
      });
      
      if (!existing) {
        try {
          await ConceptMap.create({
            namasteCode: namasteCode.code,
            icdCode: icdCode.code,
            icdType: icdCode.type,
            equivalence: 'equivalent',
            confidence: 0.8,
            mappedBy: 'auto-generator',
            mappedAt: new Date()
          });
          mappingsCreated++;
        } catch (error) {
          console.log(`⚠️ Could not create mapping: ${error}`);
        }
      }
    }
  }
  
  return mappingsCreated;
}
