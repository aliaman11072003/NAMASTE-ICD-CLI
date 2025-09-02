import { NAMASTECode, ConceptMap, ICDCode } from '../models';
import auditLogger from '../utils/auditLogger';

export async function translate(namasteCode: string): Promise<void> {
  console.log(`🔄 Translating NAMASTE code: ${namasteCode}`);
  console.log('📋 Looking for ICD-11 (TM2 + Biomedicine) mappings...\n');

  try {
    // Find the NAMASTE code
    const namasteRecord = await NAMASTECode.findOne({ code: namasteCode });
    if (!namasteRecord) {
      throw new Error(`NAMASTE code '${namasteCode}' not found in database`);
    }

    // Display NAMASTE code information
    console.log('🌿 NAMASTE Code Information:');
    console.log('─'.repeat(60));
    console.log(`   Code: ${namasteRecord.code}`);
    console.log(`   Name: ${namasteRecord.name}`);
    console.log(`   Description: ${namasteRecord.description}`);
    if (namasteRecord.category) {
      console.log(`   Category: ${namasteRecord.category}`);
    }
    console.log('');

    // Find all mappings for this NAMASTE code
    const mappings = await ConceptMap.find({ namasteCode }).populate('icdCode');
    
    if (mappings.length === 0) {
      console.log('⚠️ No ICD-11 mappings found for this NAMASTE code.');
      console.log('\n💡 To create mappings:');
      console.log('   • Use "fetch-icd" to get relevant ICD-11 codes');
      console.log('   • Use "map-code" to create mappings');
      console.log('   • Use "search" to find related codes');
      return;
    }

    // Group mappings by type
    const tm2Mappings = mappings.filter(m => m.icdType === 'TM2');
    const biomedicineMappings = mappings.filter(m => m.icdType === 'Biomedicine');

    console.log('🔗 ICD-11 Mappings:');
    console.log('─'.repeat(60));

    // Display TM2 mappings
    if (tm2Mappings.length > 0) {
      console.log(`\n🌿 TM2 (Traditional Medicine Module 2) Mappings (${tm2Mappings.length}):`);
      tm2Mappings.forEach((mapping, index) => {
        const icdCodeDoc = mapping.icdCode as any;
        console.log(`   ${index + 1}. Code: ${icdCodeDoc.code}`);
        console.log(`      Title: ${icdCodeDoc.title}`);
        if (icdCodeDoc.description) {
          console.log(`      Description: ${icdCodeDoc.description.substring(0, 80)}${icdCodeDoc.description.length > 80 ? '...' : ''}`);
        }
        console.log(`      Equivalence: ${mapping.equivalence}`);
        console.log(`      Confidence: ${mapping.confidence}`);
        console.log(`      Mapped: ${mapping.mappedAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Display Biomedicine mappings
    if (biomedicineMappings.length > 0) {
      console.log(`\n🏥 Biomedicine Mappings (${biomedicineMappings.length}):`);
      biomedicineMappings.forEach((mapping, index) => {
        const icdCodeDoc = mapping.icdCode as any;
        console.log(`   ${index + 1}. Code: ${icdCodeDoc.code}`);
        console.log(`      Title: ${icdCodeDoc.title}`);
        if (icdCodeDoc.description) {
          console.log(`      Description: ${icdCodeDoc.description.substring(0, 80)}${icdCodeDoc.description.length > 80 ? '...' : ''}`);
        }
        console.log(`      Equivalence: ${mapping.equivalence}`);
        console.log(`      Confidence: ${mapping.confidence}`);
        console.log(`      Mapped: ${mapping.mappedAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Show mapping statistics
    console.log('📊 Mapping Statistics:');
    console.log('─'.repeat(60));
    console.log(`   🌿 TM2 Mappings: ${tm2Mappings.length}`);
    console.log(`   🏥 Biomedicine Mappings: ${biomedicineMappings.length}`);
    console.log(`   📈 Total Mappings: ${mappings.length}`);
    console.log(`   🎯 Average Confidence: ${(mappings.reduce((sum, m) => sum + (m.confidence || 0), 0) / mappings.length).toFixed(2)}`);

    // Show equivalence distribution
    const equivalenceCounts = mappings.reduce((acc, m) => {
      acc[m.equivalence] = (acc[m.equivalence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🔗 Equivalence Distribution:');
    Object.entries(equivalenceCounts).forEach(([equivalence, count]) => {
      console.log(`   ${equivalence}: ${count} mappings`);
    });

    // Show recent mappings
    const recentMappings = mappings
      .sort((a, b) => b.mappedAt.getTime() - a.mappedAt.getTime())
      .slice(0, 3);

    if (recentMappings.length > 0) {
      console.log('\n🕒 Recent Mappings:');
      recentMappings.forEach((mapping, index) => {
        const icdCodeDoc = mapping.icdCode as any;
        console.log(`   ${index + 1}. ${icdCodeDoc.code} (${mapping.icdType}) - ${mapping.mappedAt.toLocaleDateString()}`);
      });
    }

    // Log audit trail
    await auditLogger.logTranslation(namasteCode, mappings.length);

    console.log('\n🎉 Translation completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   • Use "search" to find more related codes');
    console.log('   • Use "fetch-icd" to get more ICD-11 codes');
    console.log('   • Use "map-code" to create additional mappings');
    console.log('   • Use "upload-encounter" to create patient records with dual coding');

  } catch (error) {
    console.error('❌ Error during translation:', error);
    throw error;
  }
}
