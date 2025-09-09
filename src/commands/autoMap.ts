import { NAMASTECode, ICDCode, ConceptMap } from '../models';
import auditLogger from '../utils/auditLogger';

export async function autoMap(): Promise<void> {
  console.log('🤖 Starting automatic NAMASTE to ICD-11 mapping...');

  try {
    // Get all NAMASTE codes
    const namasteCodes = await NAMASTECode.find();
    console.log(`📊 Found ${namasteCodes.length} NAMASTE codes to map`);

    // Get all ICD codes
    const icdCodes = await ICDCode.find();
    console.log(`📊 Found ${icdCodes.length} ICD codes for mapping`);

    if (namasteCodes.length === 0) {
      console.log('⚠️ No NAMASTE codes found. Please import NAMASTE codes first.');
      return;
    }

    if (icdCodes.length === 0) {
      console.log('⚠️ No ICD codes found. Please fetch ICD codes first.');
      return;
    }

    let mappingsCreated = 0;
    let mappingsSkipped = 0;

    // Auto-mapping logic based on text similarity
    for (const namasteCode of namasteCodes) {
      console.log(`\n🔍 Processing: ${namasteCode.name} (${namasteCode.code})`);

      // Find potential matches based on text similarity
      const potentialMatches = findPotentialMatches(namasteCode, icdCodes);

      for (const match of potentialMatches) {
        // Check if mapping already exists
        const existingMapping = await ConceptMap.findOne({
          namasteCode: namasteCode.code,
          icdCode: match.icdCode.code,
          icdType: match.icdCode.type
        });

        if (existingMapping) {
          console.log(`   ⚠️ Mapping already exists: ${match.icdCode.code}`);
          mappingsSkipped++;
          continue;
        }

        // Create new mapping
        const mapping = new ConceptMap({
          namasteCode: namasteCode.code,
          icdCode: match.icdCode.code,
          icdType: match.icdCode.type,
          equivalence: match.equivalence,
          confidence: match.confidence,
          mappedBy: 'auto-mapper',
          mappedAt: new Date()
        });

        await mapping.save();
        console.log(`   ✅ Mapped to: ${match.icdCode.code} (${match.icdCode.type}) - ${match.equivalence} (${match.confidence})`);
        mappingsCreated++;
      }
    }

    // Log audit trail
    await auditLogger.logIngest('auto_mapping', mappingsCreated, `Auto-mapped ${mappingsCreated} codes`);

    console.log('\n🎉 Automatic mapping completed!');
    console.log(`📊 Mappings created: ${mappingsCreated}`);
    console.log(`📊 Mappings skipped: ${mappingsSkipped}`);
    console.log(`📊 Total mappings in database: ${await ConceptMap.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error during automatic mapping:', error);
    throw error;
  }
}

interface PotentialMatch {
  icdCode: any;
  equivalence: string;
  confidence: number;
}

function findPotentialMatches(namasteCode: any, icdCodes: any[]): PotentialMatch[] {
  const matches: PotentialMatch[] = [];
  const namasteText = `${namasteCode.name} ${namasteCode.description}`.toLowerCase();

  for (const icdCode of icdCodes) {
    const icdText = `${icdCode.title} ${icdCode.description || ''}`.toLowerCase();
    
    // Calculate similarity score
    const similarity = calculateSimilarity(namasteText, icdText);
    
    if (similarity > 0.3) { // Threshold for potential match
      let equivalence = 'relatedto';
      let confidence = similarity;

      // Determine equivalence based on similarity
      if (similarity > 0.8) {
        equivalence = 'equivalent';
      } else if (similarity > 0.6) {
        equivalence = 'wider';
      } else if (similarity > 0.4) {
        equivalence = 'narrower';
      }

      matches.push({
        icdCode,
        equivalence,
        confidence: Math.round(confidence * 100) / 100
      });
    }
  }

  // Sort by confidence and return top matches
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Limit to top 3 matches per NAMASTE code
}

function calculateSimilarity(text1: string, text2: string): number {
  // Simple word-based similarity calculation
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
