import { WHOApiService } from '../services/whoApiService';
import auditLogger from '../utils/auditLogger';

export async function advancedWhoApiDemo(term: string): Promise<void> {
  console.log(`🔬 Advanced WHO ICD-11 API Demo for: "${term}"`);
  console.log('=' .repeat(80));

  const whoApiService = new WHOApiService();

  try {
    // 1. Foundation Search
    console.log('\n📋 1. FOUNDATION SEARCH');
    console.log('-'.repeat(40));
    const foundationEntities = await whoApiService.searchFoundation(term, '26');
    
    if (foundationEntities.length > 0) {
      console.log(`✅ Found ${foundationEntities.length} foundation entities:`);
      foundationEntities.slice(0, 3).forEach((entity, index) => {
        console.log(`   ${index + 1}. ${entity.title}`);
        console.log(`      URI: ${entity['@id']}`);
        if (entity.definition) {
          console.log(`      Definition: ${entity.definition.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('ℹ️ No foundation entities found');
    }

    // 2. Auto-coding
    console.log('\n🤖 2. AUTO-CODING');
    console.log('-'.repeat(40));
    const autoCodedEntities = await whoApiService.autocodeDiagnosticText(term, 'mms', '26');
    
    if (autoCodedEntities.length > 0) {
      console.log(`✅ Auto-coded ${autoCodedEntities.length} entities:`);
      autoCodedEntities.slice(0, 3).forEach((entity, index) => {
        console.log(`   ${index + 1}. ${entity.title}`);
        if (entity.code) {
          console.log(`      Code: ${entity.code}`);
        }
        console.log(`      URI: ${entity['@id']}`);
      });
    } else {
      console.log('ℹ️ No auto-coded entities found');
    }

    // 3. Foundation to Linearization Lookup
    console.log('\n🔗 3. FOUNDATION TO LINEARIZATION LOOKUP');
    console.log('-'.repeat(40));
    if (foundationEntities.length > 0) {
      const firstEntity = foundationEntities[0];
      const lookupResult = await whoApiService.lookupFoundationToLinearization(firstEntity['@id']);
      
      if (lookupResult) {
        console.log(`✅ Lookup successful:`);
        console.log(`   Foundation URI: ${firstEntity['@id']}`);
        console.log(`   Linearization URI: ${lookupResult['@id']}`);
        console.log(`   Code: ${lookupResult.code || 'No code'}`);
        console.log(`   Title: ${lookupResult.title}`);
      } else {
        console.log('ℹ️ No linearization mapping found');
      }
    } else {
      console.log('ℹ️ No foundation entities to lookup');
    }

    // 4. Code Information
    console.log('\n📊 4. CODE INFORMATION');
    console.log('-'.repeat(40));
    if (autoCodedEntities.length > 0 && autoCodedEntities[0].code) {
      const codeInfo = await whoApiService.getCodeInfo(autoCodedEntities[0].code);
      
      if (codeInfo) {
        console.log(`✅ Code information retrieved:`);
        console.log(`   Code: ${codeInfo.code}`);
        console.log(`   Title: ${codeInfo.title}`);
        if (codeInfo.definition) {
          console.log(`   Definition: ${codeInfo.definition.substring(0, 150)}...`);
        }
        if (codeInfo.parent) {
          console.log(`   Parent: ${codeInfo.parent}`);
        }
        if (codeInfo.children && codeInfo.children.length > 0) {
          console.log(`   Children: ${codeInfo.children.length} subcategories`);
        }
      } else {
        console.log('ℹ️ No code information available');
      }
    } else {
      console.log('ℹ️ No codes to get information for');
    }

    // 5. Code Description
    console.log('\n📝 5. CODE DESCRIPTION');
    console.log('-'.repeat(40));
    if (autoCodedEntities.length > 0) {
      const describeResult = await whoApiService.describeCode(autoCodedEntities[0]['@id']);
      
      if (describeResult) {
        console.log(`✅ Code description retrieved:`);
        console.log(`   Title: ${describeResult.title}`);
        if (describeResult.definition) {
          console.log(`   Definition: ${describeResult.definition.substring(0, 150)}...`);
        }
        if (describeResult.postcoordination) {
          console.log(`   Postcoordination: Available`);
        }
      } else {
        console.log('ℹ️ No code description available');
      }
    } else {
      console.log('ℹ️ No entities to describe');
    }

    // 6. Complete NAMASTE Integration
    console.log('\n🌿 6. COMPLETE NAMASTE INTEGRATION');
    console.log('-'.repeat(40));
    const integrationResult = await whoApiService.integrateNAMASTETerm(term);
    
    console.log(`✅ NAMASTE Integration Summary:`);
    console.log(`   📊 Foundation entities: ${integrationResult.foundationEntities.length}`);
    console.log(`   📊 Linearization mappings: ${integrationResult.linearizationMappings.length}`);
    console.log(`   📊 Code details: ${integrationResult.codeDetails.length}`);

    if (integrationResult.linearizationMappings.length > 0) {
      console.log(`\n🔗 Mappings found:`);
      integrationResult.linearizationMappings.forEach((mapping, index) => {
        console.log(`   ${index + 1}. ${mapping.title}`);
        if (mapping.code) {
          console.log(`      Code: ${mapping.code}`);
        }
        console.log(`      URI: ${mapping['@id']}`);
      });
    }

    // Log audit trail
    await auditLogger.logIngest('advanced_who_api_demo', 1, `Demo completed for term: ${term}`);

    console.log('\n🎉 Advanced WHO API Demo completed successfully!');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Error in advanced WHO API demo:', error);
    await auditLogger.logError('advanced_who_api_demo', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function lookupCode(code: string): Promise<void> {
  console.log(`🔍 Looking up code: ${code}`);

  const whoApiService = new WHOApiService();

  try {
    const codeInfo = await whoApiService.getCodeInfo(code);
    
    if (codeInfo) {
      console.log(`\n✅ Code Information:`);
      console.log(`   Code: ${codeInfo.code}`);
      console.log(`   Title: ${codeInfo.title}`);
      if (codeInfo.definition) {
        console.log(`   Definition: ${codeInfo.definition}`);
      }
      if (codeInfo.parent) {
        console.log(`   Parent: ${codeInfo.parent}`);
      }
      if (codeInfo.children && codeInfo.children.length > 0) {
        console.log(`   Children (${codeInfo.children.length}):`);
        codeInfo.children.slice(0, 5).forEach((child, index) => {
          console.log(`     ${index + 1}. ${child}`);
        });
        if (codeInfo.children.length > 5) {
          console.log(`     ... and ${codeInfo.children.length - 5} more`);
        }
      }
      if (codeInfo.browserUrl) {
        console.log(`   Browser URL: ${codeInfo.browserUrl}`);
      }
    } else {
      console.log(`❌ Code not found: ${code}`);
    }

  } catch (error) {
    console.error('❌ Error looking up code:', error);
    throw error;
  }
}

export async function autocodeText(text: string): Promise<void> {
  console.log(`🤖 Auto-coding text: "${text}"`);

  const whoApiService = new WHOApiService();

  try {
    const autoCodedEntities = await whoApiService.autocodeDiagnosticText(text, 'mms');
    
    if (autoCodedEntities.length > 0) {
      console.log(`\n✅ Auto-coded ${autoCodedEntities.length} entities:`);
      autoCodedEntities.forEach((entity, index) => {
        console.log(`\n${index + 1}. ${entity.title}`);
        if (entity.code) {
          console.log(`   Code: ${entity.code}`);
        }
        console.log(`   URI: ${entity['@id']}`);
        if (entity.definition) {
          console.log(`   Definition: ${entity.definition.substring(0, 200)}...`);
        }
        if (entity.browserUrl) {
          console.log(`   Browser URL: ${entity.browserUrl}`);
        }
      });
    } else {
      console.log(`❌ No auto-coded entities found for: "${text}"`);
    }

  } catch (error) {
    console.error('❌ Error auto-coding text:', error);
    throw error;
  }
}
