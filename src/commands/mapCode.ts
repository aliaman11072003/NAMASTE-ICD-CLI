import { NAMASTECode, ICDCode, ConceptMap } from '../models';
import { FHIRUtils } from '../utils/fhirUtils';
import auditLogger from '../utils/auditLogger';
import * as fs from 'fs';
import * as path from 'path';

export async function mapCode(
  namasteCode: string,
  icdCode: string,
  icdType: 'TM2' | 'Biomedicine',
  equivalence: string = 'relatedto',
  confidence: number = 0.8
): Promise<void> {
  console.log(`🔗 Creating mapping between NAMASTE and ICD-11 codes`);
  console.log(`   NAMASTE: ${namasteCode}`);
  console.log(`   ICD-11: ${icdCode} (${icdType})`);
  console.log(`   Equivalence: ${equivalence}`);
  console.log(`   Confidence: ${confidence}`);

  try {
    // Validate NAMASTE code exists
    const namasteRecord = await NAMASTECode.findOne({ code: namasteCode });
    if (!namasteRecord) {
      throw new Error(`NAMASTE code '${namasteCode}' not found in database`);
    }

    // Validate ICD code exists
    const icdRecord = await ICDCode.findOne({ code: icdCode, type: icdType });
    if (!icdRecord) {
      throw new Error(`ICD-11 code '${icdCode}' of type '${icdType}' not found in database`);
    }

    // Check if mapping already exists
    const existingMapping = await ConceptMap.findOne({
      namasteCode,
      icdCode,
      icdType
    });

    if (existingMapping) {
      console.log(`⚠️ Mapping already exists. Updating...`);
      
      // Update existing mapping
      await ConceptMap.updateOne(
        { _id: existingMapping._id },
        {
          equivalence,
          confidence,
          mappedAt: new Date(),
          updatedAt: new Date()
        }
      );
      
      console.log(`✅ Mapping updated successfully`);
    } else {
      // Create new mapping
      const newMapping = new ConceptMap({
        namasteCode,
        icdCode,
        icdType,
        equivalence,
        confidence,
        mappedBy: 'system',
        mappedAt: new Date()
      });

      await newMapping.save();
      console.log(`✅ New mapping created successfully`);
    }

    // Log audit trail
    await auditLogger.logMapping(namasteCode, icdCode, icdType);

    // Generate updated FHIR ConceptMap
    console.log('\n🔧 Generating updated FHIR ConceptMap...');
    const allMappings = await ConceptMap.find().populate('namasteCode').populate('icdCode').lean();
    const fhirConceptMap = FHIRUtils.generateConceptMap(allMappings as any[]);
    
    // Save FHIR ConceptMap to file
    const outputFile = path.join(process.cwd(), 'namaste-icd-conceptmap.json');
    fs.writeFileSync(outputFile, JSON.stringify(fhirConceptMap, null, 2));
    console.log(`💾 FHIR ConceptMap saved to: ${outputFile}`);

    // Display mapping summary
    console.log('\n📊 Mapping Summary:');
    console.log(`   NAMASTE Code: ${namasteRecord.name} (${namasteCode})`);
    console.log(`   ICD-11 Code: ${icdRecord.title} (${icdCode})`);
    console.log(`   Type: ${icdType}`);
    console.log(`   Equivalence: ${equivalence}`);
    console.log(`   Confidence: ${confidence}`);

    // Show total mappings for this NAMASTE code
    const totalMappings = await ConceptMap.countDocuments({ namasteCode });
    console.log(`\n📈 Total mappings for ${namasteCode}: ${totalMappings}`);

    // Show all mappings for this NAMASTE code
    const allMappingsForCode = await ConceptMap.find({ namasteCode }).populate('icdCode');
    if (allMappingsForCode.length > 1) {
      console.log('\n🔗 All mappings for this NAMASTE code:');
      allMappingsForCode.forEach((mapping, index) => {
        const icdCodeDoc = mapping.icdCode as any;
        console.log(`   ${index + 1}. ${icdCodeDoc.code} (${icdCodeDoc.type}) - ${mapping.equivalence} (${mapping.confidence})`);
      });
    }

    console.log('\n🎉 Code mapping completed successfully!');

  } catch (error) {
    console.error('❌ Error during code mapping:', error);
    throw error;
  }
}
