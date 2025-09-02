import { NAMASTECode, ICDCode } from '../models';
import auditLogger from '../utils/auditLogger';

export async function search(query: string): Promise<void> {
  console.log(`🔍 Searching for: "${query}"`);
  console.log('📋 Searching across NAMASTE and ICD-11 (TM2 + Biomedicine) codes...\n');

  try {
    // Search NAMASTE codes
    console.log('🌿 Searching NAMASTE codes...');
    const namasteResults = await NAMASTECode.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    // Search ICD-11 TM2 codes
    console.log('🌿 Searching ICD-11 TM2 codes...');
    const tm2Results = await ICDCode.find({
      type: 'TM2',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    // Search ICD-11 Biomedicine codes
    console.log('🏥 Searching ICD-11 Biomedicine codes...');
    const biomedicineResults = await ICDCode.find({
      type: 'Biomedicine',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    // Display results
    const totalResults = namasteResults.length + tm2Results.length + biomedicineResults.length;
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 SEARCH RESULTS FOR: "${query}"`);
    console.log(`📈 Total Results: ${totalResults}`);
    console.log('='.repeat(80));

    // Display NAMASTE results
    if (namasteResults.length > 0) {
      console.log(`\n🌿 NAMASTE Codes (${namasteResults.length}):`);
      console.log('─'.repeat(50));
      namasteResults.forEach((code, index) => {
        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(`   Name: ${code.name}`);
        console.log(`   Description: ${code.description.substring(0, 100)}${code.description.length > 100 ? '...' : ''}`);
        if (code.category) {
          console.log(`   Category: ${code.category}`);
        }
        console.log('');
      });
    } else {
      console.log('\n🌿 NAMASTE Codes: No results found');
    }

    // Display TM2 results
    if (tm2Results.length > 0) {
      console.log(`\n🌿 ICD-11 TM2 Codes (${tm2Results.length}):`);
      console.log('─'.repeat(50));
      tm2Results.forEach((code, index) => {
        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(`   Title: ${code.title}`);
        if (code.description) {
          console.log(`   Description: ${code.description.substring(0, 100)}${code.description.length > 100 ? '...' : ''}`);
        }
        console.log(`   System: ${code.system}`);
        console.log('');
      });
    } else {
      console.log('\n🌿 ICD-11 TM2 Codes: No results found');
    }

    // Display Biomedicine results
    if (biomedicineResults.length > 0) {
      console.log(`\n🏥 ICD-11 Biomedicine Codes (${biomedicineResults.length}):`);
      console.log('─'.repeat(50));
      biomedicineResults.forEach((code, index) => {
        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(`   Title: ${code.title}`);
        if (code.description) {
          console.log(`   Description: ${code.description.substring(0, 100)}${code.description.length > 100 ? '...' : ''}`);
        }
        console.log(`   System: ${code.system}`);
        console.log('');
      });
    } else {
      console.log('\n🏥 ICD-11 Biomedicine Codes: No results found');
    }

    // Show summary
    console.log('='.repeat(80));
    console.log('📋 SUMMARY:');
    console.log(`   🌿 NAMASTE: ${namasteResults.length} codes`);
    console.log(`   🌿 ICD-11 TM2: ${tm2Results.length} codes`);
    console.log(`   🏥 ICD-11 Biomedicine: ${biomedicineResults.length} codes`);
    console.log(`   📊 Total: ${totalResults} codes`);
    console.log('='.repeat(80));

    // Log audit trail
    await auditLogger.logSearch(query, totalResults);

    if (totalResults === 0) {
      console.log('\n💡 No results found. Try:');
      console.log('   • Using different keywords');
      console.log('   • Using broader terms');
      console.log('   • Checking spelling');
      console.log('   • Using partial matches');
    } else {
      console.log('\n💡 Tips:');
      console.log('   • Use "map-code" to create mappings between NAMASTE and ICD-11 codes');
      console.log('   • Use "translate" to see existing mappings for a NAMASTE code');
      console.log('   • Use "fetch-icd" to get more ICD-11 codes from WHO API');
    }

  } catch (error) {
    console.error('❌ Error during search:', error);
    throw error;
  }
}
