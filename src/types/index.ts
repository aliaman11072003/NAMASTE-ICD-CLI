// FHIR Resource Types
export interface FHIRCodeSystem {
  resourceType: 'CodeSystem';
  id: string;
  url: string;
  version: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired' | 'unknown';
  experimental: boolean;
  date: string;
  publisher: string;
  description: string;
  content: 'not-present' | 'example' | 'fragment' | 'complete' | 'supplement';
  concept: FHIRConcept[];
}

export interface FHIRConcept {
  code: string;
  display: string;
  definition?: string;
  designation?: FHIRDesignation[];
}

export interface FHIRDesignation {
  language: string;
  use?: FHIRCoding;
  value: string;
}

export interface FHIRCoding {
  system: string;
  version?: string;
  code: string;
  display: string;
}

export interface FHIRConceptMap {
  resourceType: 'ConceptMap';
  id: string;
  url: string;
  version: string;
  name: string;
  title: string;
  status: 'draft' | 'active' | 'retired' | 'unknown';
  experimental: boolean;
  date: string;
  publisher: string;
  description: string;
  sourceCanonical?: string;
  targetCanonical?: string;
  group: FHIRConceptMapGroup[];
}

export interface FHIRConceptMapGroup {
  source: string;
  sourceVersion?: string;
  target: string;
  targetVersion?: string;
  element: FHIRConceptMapElement[];
}

export interface FHIRConceptMapElement {
  code: string;
  target: FHIRConceptMapTarget[];
}

export interface FHIRConceptMapTarget {
  code: string;
  display: string;
  equivalence: 'relatedto' | 'equivalent' | 'equal' | 'wider' | 'subsumes' | 'narrower' | 'specializes' | 'inexact' | 'unmatched' | 'disjoint';
  comment?: string;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  entry: FHIRBundleEntry[];
}

export interface FHIRBundleEntry {
  resource: any;
  request?: FHIRBundleRequest;
  response?: FHIRBundleResponse;
}

export interface FHIRBundleRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
}

export interface FHIRBundleResponse {
  status: string;
  location?: string;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  class: FHIRCoding;
  subject: FHIRReference;
  period?: FHIRPeriod;
  reasonCode?: FHIRCodeableConcept[];
  diagnosis?: FHIREncounterDiagnosis[];
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIREncounterDiagnosis {
  condition: FHIRReference;
  use?: FHIRCodeableConcept;
  rank?: number;
}

export interface FHIRCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus?: FHIRCodeableConcept;
  verificationStatus?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  severity?: FHIRCodeableConcept;
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  encounter?: FHIRReference;
  onsetDateTime?: string;
  recordedDate?: string;
  recorder?: FHIRReference;
  asserter?: FHIRReference;
}

// Database Model Types
export interface NAMASTECode {
  _id?: string;
  code: string;
  name: string;
  description: string;
  category?: string;
  system?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICDCode {
  _id?: string;
  code: string;
  title: string;
  type: 'TM2' | 'Biomedicine';
  description?: string;
  system: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptMap {
  _id?: string;
  namasteCode: string;
  icdCode: string;
  icdType: 'TM2' | 'Biomedicine';
  equivalence: string;
  confidence?: number;
  mappedBy?: string;
  mappedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Encounter {
  _id?: string;
  encounterId: string;
  patientId: string;
  problems: Problem[];
  encounterDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Problem {
  namasteCode?: string;
  icdCode?: string;
  icdType?: 'TM2' | 'Biomedicine';
  description: string;
  severity?: string;
  onsetDate?: Date;
}

export interface AuditLog {
  _id?: string;
  user: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
  ipAddress?: string;
}

// WHO API Response Types
export interface WHOICDResponse {
  destinationEntities: WHOICDEntity[];
  totalResults: number;
  searchQuery: string;
}

export interface WHOICDEntity {
  id: string;
  title: string;
  definition?: string;
  inclusion?: string[];
  exclusion?: string[];
  codingNote?: string;
  classKind?: string;
  isLeaf?: boolean;
  properties?: WHOICDProperty[];
}

export interface WHOICDProperty {
  propertyName: string;
  propertyValue: string;
}

// CLI Command Types
export interface SearchResult {
  namasteCodes: NAMASTECode[];
  icdCodes: ICDCode[];
  totalResults: number;
}

export interface TranslationResult {
  namasteCode: NAMASTECode;
  mappings: ConceptMap[];
}

// Configuration Types
export interface AppConfig {
  mongodb: {
    uri: string;
  };
  who: {
    apiBaseUrl: string;
    timeout: number;
  };
  fhir: {
    version: string;
    baseUrl: string;
  };
  app: {
    env: string;
    logLevel: string;
  };
}
