import { ICDCode } from '../models';
import whoApi from '../utils/whoApi';
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
    // Fetch codes based on type
    if (type === 'TM2' || type === 'both') {
      console.log('\n🌿 Fetching TM2 (Traditional Medicine Module 2) codes...');
      tm2Codes = await whoApi.searchTM2Codes(query);
      console.log(whoApi.formatSearchResults(tm2Codes, 'TM2'));
    }

    if (type === 'Biomedicine' || type === 'both') {
      console.log('\n🏥 Fetching Biomedicine codes...');
      biomedicineCodes = await whoApi.searchBiomedicineCodes(query);
      console.log(whoApi.formatSearchResults(biomedicineCodes, 'Biomedicine'));
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
