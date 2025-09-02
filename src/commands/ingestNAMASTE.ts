import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { NAMASTECode } from '../models';
import { NAMASTECode as INAMASTECode } from '../types';
import { FHIRUtils } from '../utils/fhirUtils';
import auditLogger from '../utils/auditLogger';

export async function ingestNAMASTE(csvFile: string): Promise<void> {
  console.log(`📥 Starting NAMASTE CSV ingestion from: ${csvFile}`);

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

          // Insert into database
          console.log('\n💾 Inserting NAMASTE codes into database...');
          const insertedCodes = await NAMASTECode.insertMany(results, { ordered: false });
          console.log(`✅ Successfully inserted ${insertedCodes.length} NAMASTE codes`);

          // Generate FHIR CodeSystem
          console.log('\n🔧 Generating FHIR CodeSystem...');
          const fhirCodeSystem = FHIRUtils.generateNAMASTECodeSystem(results);
          
          // Save FHIR CodeSystem to file
          const outputFile = path.join(process.cwd(), 'namaste-codesystem.json');
          fs.writeFileSync(outputFile, JSON.stringify(fhirCodeSystem, null, 2));
          console.log(`💾 FHIR CodeSystem saved to: ${outputFile}`);

          // Log audit trail
          await auditLogger.logIngest('namaste_codes', insertedCodes.length, csvFile);

          console.log('\n🎉 NAMASTE ingestion completed successfully!');
          console.log(`📊 Total codes in database: ${await NAMASTECode.countDocuments()}`);
          
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
