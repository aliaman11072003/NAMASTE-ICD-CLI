import * as fs from 'fs';
import { Encounter, NAMASTECode, ICDCode, ConceptMap } from '../models';
import { FHIRUtils } from '../utils/fhirUtils';
import auditLogger from '../utils/auditLogger';

export async function uploadEncounter(jsonFile: string): Promise<void> {
  console.log(`📤 Uploading FHIR Encounter from: ${jsonFile}`);

  // Check if file exists
  if (!fs.existsSync(jsonFile)) {
    throw new Error(`JSON file not found: ${jsonFile}`);
  }

  try {
    // Read and parse JSON file
    console.log('📖 Reading JSON file...');
    const fileContent = fs.readFileSync(jsonFile, 'utf8');
    const encounterData = JSON.parse(fileContent);

    // Validate FHIR resource
    if (!FHIRUtils.validateFHIRResource(encounterData)) {
      throw new Error('Invalid FHIR resource format');
    }

    console.log('✅ JSON file parsed successfully');
    console.log(`📋 Resource Type: ${encounterData.resourceType}`);

    let encounterToSave: any;

    if (encounterData.resourceType === 'Encounter') {
      // Single encounter resource
      encounterToSave = await processEncounterResource(encounterData);
    } else if (encounterData.resourceType === 'Bundle') {
      // Bundle of resources
      console.log('📦 Processing FHIR Bundle...');
      const encounterEntry = encounterData.entry?.find((entry: any) => 
        entry.resource?.resourceType === 'Encounter'
      );
      
      if (!encounterEntry) {
        throw new Error('No Encounter resource found in Bundle');
      }
      
      encounterToSave = await processEncounterResource(encounterEntry.resource);
    } else {
      throw new Error(`Unsupported resource type: ${encounterData.resourceType}`);
    }

    // Save encounter to database
    console.log('\n💾 Saving encounter to database...');
    const savedEncounter = await Encounter.create(encounterToSave);
    console.log(`✅ Encounter saved with ID: ${savedEncounter._id}`);

    // Generate FHIR Bundle
    console.log('\n🔧 Generating FHIR Bundle...');
    const fhirBundle = FHIRUtils.generateEncounterBundle(savedEncounter);
    
    // Save FHIR Bundle to file
    const outputFile = `encounter-${savedEncounter.encounterId}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(fhirBundle, null, 2));
    console.log(`💾 FHIR Bundle saved to: ${outputFile}`);

    // Log audit trail
    await auditLogger.logEncounterUpload(
      savedEncounter.encounterId,
      savedEncounter.patientId,
      savedEncounter.problems.length
    );

    // Display summary
    console.log('\n📊 Encounter Summary:');
    console.log('─'.repeat(60));
    console.log(`   Encounter ID: ${savedEncounter.encounterId}`);
    console.log(`   Patient ID: ${savedEncounter.patientId}`);
    console.log(`   Problems: ${savedEncounter.problems.length}`);
    console.log(`   Encounter Date: ${savedEncounter.encounterDate.toLocaleDateString()}`);
    console.log(`   Created: ${savedEncounter.createdAt.toLocaleDateString()}`);

    // Show problem details
    console.log('\n🔍 Problem Details:');
    savedEncounter.problems.forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem.description}`);
      if (problem.namasteCode) {
        console.log(`      NAMASTE: ${problem.namasteCode}`);
      }
      if (problem.icdCode) {
        console.log(`      ICD-11 (${problem.icdType}): ${problem.icdCode}`);
      }
      if (problem.severity) {
        console.log(`      Severity: ${problem.severity}`);
      }
      console.log('');
    });

    console.log('\n🎉 Encounter upload completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   • Use "search" to find more codes');
    console.log('   • Use "map-code" to create additional mappings');
    console.log('   • Use "view-logs" to see audit trail');

  } catch (error) {
    console.error('❌ Error during encounter upload:', error);
    throw error;
  }
}

async function processEncounterResource(encounterResource: any): Promise<any> {
  console.log('🔍 Processing Encounter resource...');

  // Extract basic encounter information
  const encounterId = encounterResource.id || `enc-${Date.now()}`;
  const patientId = encounterResource.subject?.reference?.replace('Patient/', '') || `patient-${Date.now()}`;
  const encounterDate = encounterResource.period?.start ? new Date(encounterResource.period.start) : new Date();

  // Process problems from diagnosis
  const problems = [];
  if (encounterResource.diagnosis && Array.isArray(encounterResource.diagnosis)) {
    for (const diagnosis of encounterResource.diagnosis) {
      const problem = await processDiagnosis(diagnosis);
      if (problem) {
        problems.push(problem);
      }
    }
  }

  // If no problems from diagnosis, try to extract from reasonCode
  if (problems.length === 0 && encounterResource.reasonCode) {
    for (const reason of encounterResource.reasonCode) {
      const problem = await processCodeableConcept(reason, 'reason');
      if (problem) {
        problems.push(problem);
      }
    }
  }

  // Validate that we have at least one problem
  if (problems.length === 0) {
    console.log('⚠️ No problems found in encounter. Creating default problem...');
    problems.push({
      description: 'Encounter recorded without specific problem',
      severity: 'moderate'
    });
  }

  return {
    encounterId,
    patientId,
    problems,
    encounterDate
  };
}

async function processDiagnosis(diagnosis: any): Promise<any> {
  if (!diagnosis.condition?.reference) {
    return null;
  }

  // Try to find the condition resource or extract from reference
  const conditionRef = diagnosis.condition.reference;
  const problem: any = {
    description: diagnosis.condition.display || 'Diagnosis condition',
    severity: 'moderate'
  };

  // Extract codes if available
  if (diagnosis.condition.coding) {
    const codes = await processCodeableConcept(diagnosis.condition, 'diagnosis');
    if (codes) {
      Object.assign(problem, codes);
    }
  }

  return problem;
}

async function processCodeableConcept(codeableConcept: any, source: string): Promise<any> {
  if (!codeableConcept.coding || !Array.isArray(codeableConcept.coding)) {
    return null;
  }

  const result: any = {};

  for (const coding of codeableConcept.coding) {
    if (!coding.system || !coding.code) {
      continue;
    }

    // Check if it's a NAMASTE code
    if (coding.system.includes('namaste') || coding.system.includes('ayush')) {
      const namasteCode = await NAMASTECode.findOne({ code: coding.code });
      if (namasteCode) {
        result.namasteCode = coding.code;
        result.description = coding.display || namasteCode.name;
      }
    }
    // Check if it's an ICD-11 code
    else if (coding.system.includes('icd') || coding.system.includes('who')) {
      // Determine type based on system or code pattern
      let icdType: 'TM2' | 'Biomedicine' = 'Biomedicine';
      if (coding.system.includes('tm2') || coding.code.startsWith('TM2')) {
        icdType = 'TM2';
      }

      const icdCode = await ICDCode.findOne({ code: coding.code, type: icdType });
      if (icdCode) {
        result.icdCode = coding.code;
        result.icdType = icdType;
        result.description = coding.display || icdCode.title;
      }
    }
  }

  return result;
}
