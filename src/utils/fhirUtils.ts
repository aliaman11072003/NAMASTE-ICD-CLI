import { 
  FHIRCodeSystem, 
  FHIRConceptMap, 
  FHIRBundle, 
  FHIREncounter,
  NAMASTECode,
  ICDCode,
  ConceptMap
} from '../types';

export class FHIRUtils {
  /**
   * Generate FHIR CodeSystem from NAMASTE codes
   */
  public static generateNAMASTECodeSystem(codes: NAMASTECode[]): FHIRCodeSystem {
    return {
      resourceType: 'CodeSystem',
      id: 'namaste-codes',
      url: 'https://namaste.ayush.gov.in/codes',
      version: '1.0.0',
      name: 'NAMASTE-CodeSystem',
      title: 'National AYUSH Morbidity & Standardized Terminologies Electronic',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      description: 'Standardized terminologies for Ayurveda, Siddha and Unani disorders',
      content: 'complete',
      concept: codes.map(code => ({
        code: code.code,
        display: code.name,
        definition: code.description
      }))
    };
  }

  /**
   * Generate FHIR CodeSystem from ICD codes
   */
  public static generateICDCodeSystem(codes: ICDCode[], type: 'TM2' | 'Biomedicine'): FHIRCodeSystem {
    const typeLabel = type === 'TM2' ? 'Traditional Medicine Module 2' : 'Biomedicine';
    return {
      resourceType: 'CodeSystem',
      id: `icd-11-${type.toLowerCase()}`,
      url: `https://icd.who.int/icdapi/${type}`,
      version: '11.0',
      name: `ICD-11-${type}`,
      title: `ICD-11 ${typeLabel}`,
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'World Health Organization',
      description: `ICD-11 ${typeLabel} codes for traditional medicine and biomedicine`,
      content: 'complete',
      concept: codes.map(code => ({
        code: code.code,
        display: code.title,
        definition: code.description
      }))
    };
  }

  /**
   * Generate FHIR ConceptMap from concept mappings
   */
  public static generateConceptMap(mappings: ConceptMap[]): FHIRConceptMap {
    // Group mappings by NAMASTE code
    const groupedMappings = mappings.reduce((acc, mapping) => {
      if (!acc[mapping.namasteCode]) {
        acc[mapping.namasteCode] = [];
      }
      acc[mapping.namasteCode].push(mapping);
      return acc;
    }, {} as Record<string, ConceptMap[]>);

    return {
      resourceType: 'ConceptMap',
      id: 'namaste-icd-mapping',
      url: 'https://namaste.ayush.gov.in/conceptmap',
      version: '1.0.0',
      name: 'NAMASTE-ICD-ConceptMap',
      title: 'NAMASTE to ICD-11 Concept Mapping',
      status: 'active',
      experimental: false,
      date: new Date().toISOString(),
      publisher: 'Ministry of AYUSH, Government of India',
      description: 'Concept mapping between NAMASTE codes and ICD-11 (TM2 + Biomedicine)',
      sourceCanonical: 'https://namaste.ayush.gov.in/codes',
      targetCanonical: 'https://icd.who.int/icdapi/',
      group: [
        {
          source: 'https://namaste.ayush.gov.in/codes',
          target: 'https://icd.who.int/icdapi/TM2',
          element: Object.entries(groupedMappings).map(([namasteCode, mappings]) => ({
            code: namasteCode,
            target: mappings
              .filter(m => m.icdType === 'TM2')
              .map(m => ({
                code: m.icdCode,
                display: m.icdCode, // You might want to fetch the actual display from ICD codes
                equivalence: m.equivalence as any,
                comment: `Confidence: ${m.confidence}`
              }))
          }))
        },
        {
          source: 'https://namaste.ayush.gov.in/codes',
          target: 'https://icd.who.int/icdapi/Biomedicine',
          element: Object.entries(groupedMappings).map(([namasteCode, mappings]) => ({
            code: namasteCode,
            target: mappings
              .filter(m => m.icdType === 'Biomedicine')
              .map(m => ({
                code: m.icdCode,
                display: m.icdCode, // You might want to fetch the actual display from ICD codes
                equivalence: m.equivalence as any,
                comment: `Confidence: ${m.confidence}`
              }))
          }))
        }
      ]
    };
  }

  /**
   * Generate FHIR Bundle from encounter data
   */
  public static generateEncounterBundle(encounter: any): FHIRBundle {
    return {
      resourceType: 'Bundle',
      id: `encounter-${encounter.encounterId}`,
      type: 'document',
      entry: [
        {
          resource: encounter.fhirEncounter
        }
      ]
    };
  }

  /**
   * Validate FHIR resource
   */
  public static validateFHIRResource(resource: any): boolean {
    if (!resource.resourceType) {
      return false;
    }
    
    // Basic validation - you can add more specific validation rules
    switch (resource.resourceType) {
      case 'CodeSystem':
        return !!(resource.id && resource.url && resource.concept);
      case 'ConceptMap':
        return !!(resource.id && resource.url && resource.group);
      case 'Encounter':
        return !!(resource.id && resource.status && resource.subject);
      default:
        return true;
    }
  }

  /**
   * Format FHIR resource for output
   */
  public static formatFHIRResource(resource: any): string {
    return JSON.stringify(resource, null, 2);
  }
}
