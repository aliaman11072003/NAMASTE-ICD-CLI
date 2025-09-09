import { ICDCode } from '../models';
import { createAxiosClient } from '../services/icdAuth';
import { FHIRUtils } from '../utils/fhirUtils';
import auditLogger from '../utils/auditLogger';
import * as fs from 'fs';
import * as path from 'path';

export async function fetchICD(query: string, type: 'TM2' | 'Biomedicine' | 'both'): Promise<void> {
  console.log(`🔍 Fetching ICD-11 codes for query: "${query}"`);
  console.log(`📋 Type: ${type === 'both' ? 'TM2 + Biomedicine' : type}`);

  let tm2Codes: any[] = [];
  let biomedicineCodes: any[] = [];
  let totalInserted = 0;

  try {
    // Create authenticated ICD API client
    // Use WHO_API_BASE_URL if provided, otherwise default to latest release path
    // Example: https://id.who.int/icd/release/11/2024
    const apiBase = process.env.WHO_API_BASE_URL || 'https://id.who.int/icd/release/11/2024';
    const icdClient = createAxiosClient(apiBase);
    
    // Fetch codes based on type
    if (type === 'TM2' || type === 'both') {
      console.log('\n🌿 Fetching TM2 (Traditional Medicine Module 2) codes...');
      tm2Codes = await searchTM2Codes(icdClient, query);
      console.log(formatSearchResults(tm2Codes, 'TM2'));
    }

    if (type === 'Biomedicine' || type === 'both') {
      console.log('\n🏥 Fetching Biomedicine codes...');
      biomedicineCodes = await searchBiomedicineCodes(icdClient, query);
      console.log(formatSearchResults(biomedicineCodes, 'Biomedicine'));
    }

    // Process and store TM2 codes
    if (tm2Codes.length > 0) {
      console.log('\n💾 Storing TM2 codes in database...');
      const tm2Documents = tm2Codes.map(entity => ({
        code: entity.id,
        title: entity.title,
        type: 'TM2' as const,
        description: entity.definition || entity.inclusion?.join('; ') || '',
        system: 'https://icd.who.int/icdapi/TM2',
        version: '11'
      }));

      try {
        const insertedTM2 = await ICDCode.insertMany(tm2Documents, { ordered: false });
        console.log(`✅ Successfully inserted ${insertedTM2.length} TM2 codes`);
        totalInserted += insertedTM2.length;
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key error - some codes already exist
          console.log('⚠️ Some TM2 codes already exist in database');
          // Try to insert non-duplicates
          const existingCodes = await ICDCode.find({ 
            code: { $in: tm2Codes.map(e => e.id) },
            type: 'TM2'
          }).select('code');
          const existingCodeSet = new Set(existingCodes.map(c => c.code));
          const newTM2Codes = tm2Documents.filter(doc => !existingCodeSet.has(doc.code));
          
          if (newTM2Codes.length > 0) {
            const insertedNew = await ICDCode.insertMany(newTM2Codes);
            console.log(`✅ Inserted ${insertedNew.length} new TM2 codes`);
            totalInserted += insertedNew.length;
          }
        } else {
          throw error;
        }
      }
    }

    // Process and store Biomedicine codes
    if (biomedicineCodes.length > 0) {
      console.log('\n💾 Storing Biomedicine codes in database...');
      const biomedicineDocuments = biomedicineCodes.map(entity => ({
        code: entity.id,
        title: entity.title,
        type: 'Biomedicine' as const,
        description: entity.definition || entity.inclusion?.join('; ') || '',
        system: 'https://icd.who.int/icdapi/Biomedicine',
        version: '11'
      }));

      try {
        const insertedBiomedicine = await ICDCode.insertMany(biomedicineDocuments, { ordered: false });
        console.log(`✅ Successfully inserted ${insertedBiomedicine.length} Biomedicine codes`);
        totalInserted += insertedBiomedicine.length;
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key error - some codes already exist
          console.log('⚠️ Some Biomedicine codes already exist in database');
          // Try to insert non-duplicates
          const existingCodes = await ICDCode.find({ 
            code: { $in: biomedicineCodes.map(e => e.id) },
            type: 'Biomedicine'
          }).select('code');
          const existingCodeSet = new Set(existingCodes.map(c => c.code));
          const newBiomedicineCodes = biomedicineDocuments.filter(doc => !existingCodeSet.has(doc.code));
          
          if (newBiomedicineCodes.length > 0) {
            const insertedNew = await ICDCode.insertMany(newBiomedicineCodes);
            console.log(`✅ Inserted ${insertedNew.length} new Biomedicine codes`);
            totalInserted += insertedNew.length;
          }
        } else {
          throw error;
        }
      }
    }

    // Generate FHIR CodeSystems
    if (totalInserted > 0) {
      console.log('\n🔧 Generating FHIR CodeSystems...');
      
      // Get all codes of each type for FHIR generation
      const allTM2Codes = await ICDCode.find({ type: 'TM2' }).lean();
      const allBiomedicineCodes = await ICDCode.find({ type: 'Biomedicine' }).lean();

      if (allTM2Codes.length > 0) {
        const tm2CodeSystem = FHIRUtils.generateICDCodeSystem(allTM2Codes as any[], 'TM2');
        const tm2OutputFile = path.join(process.cwd(), 'icd-11-tm2-codesystem.json');
        fs.writeFileSync(tm2OutputFile, JSON.stringify(tm2CodeSystem, null, 2));
        console.log(`💾 TM2 CodeSystem saved to: ${tm2OutputFile}`);
      }

      if (allBiomedicineCodes.length > 0) {
        const biomedicineCodeSystem = FHIRUtils.generateICDCodeSystem(allBiomedicineCodes as any[], 'Biomedicine');
        const biomedicineOutputFile = path.join(process.cwd(), 'icd-11-biomedicine-codesystem.json');
        fs.writeFileSync(biomedicineOutputFile, JSON.stringify(biomedicineCodeSystem, null, 2));
        console.log(`💾 Biomedicine CodeSystem saved to: ${biomedicineOutputFile}`);
      }
    }

    // Log audit trail
    await auditLogger.logIngest('icd_codes', totalInserted, `WHO API - ${query}`);

    console.log('\n🎉 ICD-11 code fetching completed successfully!');
    console.log(`📊 Total codes inserted: ${totalInserted}`);
    console.log(`📊 Total TM2 codes in database: ${await ICDCode.countDocuments({ type: 'TM2' })}`);
    console.log(`📊 Total Biomedicine codes in database: ${await ICDCode.countDocuments({ type: 'Biomedicine' })}`);

  } catch (error) {
    console.error('❌ Error during ICD-11 code fetching:', error);
    throw error;
  }
}

// Helper methods for searching ICD codes
async function searchTM2Codes(client: any, query: string): Promise<any[]> {
  try {
    // Correct WHO ICD API path uses /linearization/{lin}/search under the release base URL
    const response = await client.get('/linearization/tm2/search', {
      params: {
        q: query,
        propertiesToBeSearched: 'Title,Definition,Exclusion,Inclusion',
        useFlexisearch: true,
        flatResults: false,
        // linearization specified in path
      }
    });

    if (response.data && response.data.destinationEntities) {
      return response.data.destinationEntities;
    }
    return [];
  } catch (error) {
    console.error('❌ Error searching TM2 codes:', error);
    return [];
  }
}

async function searchBiomedicineCodes(client: any, query: string): Promise<any[]> {
  try {
    // Correct WHO ICD API path uses /linearization/{lin}/search under the release base URL
    const response = await client.get('/linearization/mms/search', {
      params: {
        q: query,
        propertiesToBeSearched: 'Title,Definition,Exclusion,Inclusion',
        useFlexisearch: true,
        flatResults: false,
        // linearization specified in path
      }
    });

    if (response.data && response.data.destinationEntities) {
      return response.data.destinationEntities;
    }
    return [];
  } catch (error) {
    console.error('❌ Error searching Biomedicine codes:', error);
    return [];
  }
}

function formatSearchResults(entities: any[], type: 'TM2' | 'Biomedicine'): string {
  if (entities.length === 0) {
    return `No ICD-11 ${type} codes found.`;
  }

  let result = `\n📋 ICD-11 ${type} Codes Found (${entities.length}):\n`;
  result += '─'.repeat(80) + '\n';

  entities.forEach((entity, index) => {
    result += `${index + 1}. Code: ${entity.id}\n`;
    result += `   Title: ${entity.title}\n`;
    if (entity.definition) {
      result += `   Definition: ${entity.definition.substring(0, 100)}${entity.definition.length > 100 ? '...' : ''}\n`;
    }
    if (entity.inclusion && entity.inclusion.length > 0) {
      result += `   Inclusion: ${entity.inclusion[0].substring(0, 80)}${entity.inclusion[0].length > 80 ? '...' : ''}\n`;
    }
    result += '\n';
  });

  return result;
}
