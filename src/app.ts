#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import Database from './db';
import auditLogger from './utils/auditLogger';

// Load environment variables
dotenv.config();

// Import commands
import { ingestNAMASTE } from './commands/ingestNAMASTE';
import { fetchICD } from './commands/fetchICD';
import { mapCode } from './commands/mapCode';
import { search } from './commands/search';
import { translate } from './commands/translate';
import { uploadEncounter } from './commands/uploadEncounter';
import { viewLogs } from './commands/viewLogs';

const program = new Command();

// Set program metadata
program
  .name('namaste-icd-cli')
  .description('CLI for integrating NAMASTE and ICD-11 (TM2 + Biomedicine) into EMR systems')
  .version('1.0.0');

// Global error handler
program.exitOverride();

// Add commands
program
  .command('ingest-namaste <csv-file>')
  .description('Import NAMASTE codes from CSV file')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (csvFile: string, options: { user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await ingestNAMASTE(csvFile);
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('ingest_namaste', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('fetch-icd <query>')
  .description('Fetch ICD-11 codes from WHO API')
  .option('-t, --type <type>', 'ICD type (TM2 or Biomedicine)', 'both')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (query: string, options: { type: string; user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await fetchICD(query, options.type as 'TM2' | 'Biomedicine' | 'both');
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('fetch_icd', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('map-code <namaste-code> <icd-code>')
  .description('Create mapping between NAMASTE and ICD-11 codes')
  .option('-t, --type <type>', 'ICD type (TM2 or Biomedicine)', 'TM2')
  .option('-e, --equivalence <equivalence>', 'Equivalence relationship', 'relatedto')
  .option('-c, --confidence <confidence>', 'Confidence level (0-1)', '0.8')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (namasteCode: string, icdCode: string, options: { type: string; equivalence: string; confidence: string; user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await mapCode(
        namasteCode, 
        icdCode, 
        options.type as 'TM2' | 'Biomedicine',
        options.equivalence,
        parseFloat(options.confidence)
      );
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('map_code', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search across NAMASTE and ICD-11 codes')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (query: string, options: { user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await search(query);
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('search', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('translate <namaste-code>')
  .description('Show ICD-11 mappings for a NAMASTE code')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (namasteCode: string, options: { user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await translate(namasteCode);
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('translate', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('upload-encounter <json-file>')
  .description('Upload FHIR Encounter JSON file')
  .option('-u, --user <user>', 'User performing the action', 'system')
  .action(async (jsonFile: string, options: { user: string }) => {
    try {
      await Database.connect();
      auditLogger.setUser(options.user);
      await uploadEncounter(jsonFile);
    } catch (error) {
      console.error('❌ Error:', error);
      await auditLogger.logError('upload_encounter', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('view-logs')
  .description('Show audit logs')
  .option('-l, --limit <limit>', 'Number of logs to show', '50')
  .option('-u, --user <user>', 'Filter by user')
  .option('-a, --action <action>', 'Filter by action')
  .action(async (options: { limit: string; user?: string; action?: string }) => {
    try {
      await Database.connect();
      await viewLogs(parseInt(options.limit), options.user, options.action);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Add a status command to check system health
program
  .command('status')
  .description('Check system status and connectivity')
  .action(async () => {
    try {
      console.log('🔍 Checking system status...\n');
      
      // Check database connection
      console.log('📊 Database Status:');
      try {
        await Database.connect();
        console.log('   ✅ MongoDB: Connected');
      } catch (error) {
        console.log('   ❌ MongoDB: Connection failed');
      }

      // Check WHO API status
      console.log('\n🌐 WHO API Status:');
      const whoApi = (await import('./utils/whoApi')).default;
      const apiStatus = await whoApi.getAPIStatus();
      console.log(`   ${apiStatus ? '✅' : '❌'} WHO ICD-11 API: ${apiStatus ? 'Available' : 'Unavailable'}`);

      console.log('\n✨ System status check completed!');
    } catch (error) {
      console.error('❌ Error checking system status:', error);
      process.exit(1);
    }
  });

// Add help information
program.addHelpText('after', `

Examples:
  $ namaste-icd-cli ingest-namaste namaste.csv
  $ namaste-icd-cli fetch-icd "digestion" --type TM2
  $ namaste-icd-cli map-code NAM123 ICD456 --type TM2
  $ namaste-icd-cli search "digestion"
  $ namaste-icd-cli translate NAM123
  $ namaste-icd-cli upload-encounter encounter.json
  $ namaste-icd-cli view-logs --limit 20
  $ namaste-icd-cli status

For more information, visit: https://github.com/your-repo/namaste-icd-cli
`);

// Parse command line arguments
async function main() {
  try {
    await program.parseAsync();
  } catch (error) {
    if (error instanceof Error && error.message.includes('help')) {
      // User requested help, exit gracefully
      process.exit(0);
    } else {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    }
  } finally {
    // Always disconnect from database
    if (Database.isConnectedToDB()) {
      await Database.disconnect();
    }
  }
}

// Run the application
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
