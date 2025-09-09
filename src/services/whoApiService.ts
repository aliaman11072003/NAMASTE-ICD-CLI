import axios, { AxiosInstance } from 'axios';
import { ICDAuthService } from './icdAuth';
import { ensureHttps } from '../utils/httpsUtil';

export interface WHOApiEntity {
  '@id': string;
  title: string;
  definition?: string;
  code?: string;
  browserUrl?: string;
  parent?: string;
  children?: string[];
  ancestors?: string[];
  descendants?: string[];
  diagnosticCriteria?: string;
}

export interface WHOApiSearchResult {
  destinationEntities: WHOApiEntity[];
  error?: string;
  errorMessage?: string;
  resultChopped?: boolean;
  wordSuggestionsChopped?: boolean;
  guessType?: string;
  uniqueSearchId?: string;
  words?: string[];
}

export interface WHOApiLookupResult {
  '@id': string;
  title: string;
  code?: string;
  browserUrl?: string;
  foundationUri?: string;
  linearizationUri?: string;
}

export interface WHOApiCodeInfo {
  '@id': string;
  title: string;
  definition?: string;
  code: string;
  browserUrl?: string;
  parent?: string;
  children?: string[];
  ancestors?: string[];
  descendants?: string[];
  postcoordination?: any;
}

export class WHOApiService {
  private authService: ICDAuthService;
  private client: AxiosInstance;
  private releaseId: string;

  constructor() {
    this.authService = ICDAuthService.getInstance();
    this.releaseId = process.env.WHO_API_RELEASE_ID || '2025-01';
    this.client = this.authService.createAxiosClient(process.env.WHO_API_BASE_URL);
  }

  /**
   * Look up foundation entity within linearization to get coding
   * This is crucial for NAMASTE integration - maps foundation URIs to MMS codes
   */
  async lookupFoundationToLinearization(foundationUri: string, linearizationName: string = 'mms'): Promise<WHOApiLookupResult | null> {
    try {
      console.log(`🔍 Looking up foundation URI: ${foundationUri}`);
      
      const response = await this.client.get(`/release/11/${this.releaseId}/${linearizationName}/lookup`, {
        params: {
          foundationUri: foundationUri
        }
      });

      if (response.data && response.data['@id']) {
        console.log(`✅ Found linearization mapping: ${response.data.code || 'No code'}`);
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Lookup failed for ${foundationUri}:`, error.response?.status || error.message);
      return null;
    }
  }

  /**
   * Get detailed information about a specific code
   * Essential for code validation and detailed information
   */
  async getCodeInfo(code: string, linearizationName: string = 'mms'): Promise<WHOApiCodeInfo | null> {
    try {
      console.log(`🔍 Getting code info for: ${code}`);
      
      // URL encode the code for special characters like & and /
      const encodedCode = encodeURIComponent(code);
      
      const response = await this.client.get(`/release/11/${this.releaseId}/${linearizationName}/codeinfo/${encodedCode}`, {
        params: {
          flexiblemode: true,
          convertToTerminalCodes: true
        }
      });

      if (response.data && response.data['@id']) {
        console.log(`✅ Retrieved code info: ${response.data.title}`);
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Code info failed for ${code}:`, error.response?.status || error.message);
      return null;
    }
  }

  /**
   * Automatic coding for diagnostic text
   * Perfect for NAMASTE term mapping
   */
  async autocodeDiagnosticText(searchText: string, linearizationName: string = 'mms', chapterFilter?: string): Promise<WHOApiEntity[]> {
    try {
      console.log(`🔍 Auto-coding diagnostic text: "${searchText}"`);
      
      const params: any = {
        searchText: searchText,
        matchThreshold: 0.7
      };

      if (chapterFilter) {
        params.subtreesFilter = chapterFilter;
      }

      const response = await this.client.get(`/release/11/${this.releaseId}/${linearizationName}/autocode`, {
        params
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Auto-coded ${response.data.length} entities`);
        return response.data;
      } else if (response.data && response.data['@id']) {
        console.log(`✅ Auto-coded 1 entity`);
        return [response.data];
      }

      return [];
    } catch (error: any) {
      console.error(`❌ Auto-coding failed for "${searchText}":`, error.response?.status || error.message);
      return [];
    }
  }

  /**
   * Get detailed information on a code, URI or combination
   * Useful for postcoordination and detailed analysis
   */
  async describeCode(codeOrUri: string, linearizationName: string = 'mms'): Promise<WHOApiCodeInfo | null> {
    try {
      console.log(`🔍 Describing code/URI: ${codeOrUri}`);
      
      const params: any = {
        simplify: true,
        flexiblemode: true,
        convertToTerminalCodes: true
      };

      // Determine if it's a code or URI
      if (codeOrUri.startsWith('http')) {
        params.uri = codeOrUri;
      } else {
        params.code = codeOrUri;
      }

      const response = await this.client.get(`/release/11/${this.releaseId}/${linearizationName}/describe`, {
        params
      });

      if (response.data && response.data['@id']) {
        console.log(`✅ Described entity: ${response.data.title}`);
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Describe failed for ${codeOrUri}:`, error.response?.status || error.message);
      return null;
    }
  }

  /**
   * Search foundation component for NAMASTE terms
   * This is the first step in NAMASTE integration
   */
  async searchFoundation(query: string, chapterFilter?: string): Promise<WHOApiEntity[]> {
    try {
      console.log(`🔍 Searching foundation for: "${query}"`);
      
      const params: any = {
        q: query,
        useFlexisearch: true,
        flatResults: true,
        propertiesToBeSearched: 'Title,Definition,Exclusion,Inclusion',
        highlightingEnabled: true
      };

      if (chapterFilter) {
        params.chapterFilter = chapterFilter;
      }

      const response = await this.client.get('/entity/search', { params });

      if (response.data && response.data.destinationEntities) {
        console.log(`✅ Found ${response.data.destinationEntities.length} foundation entities`);
        return response.data.destinationEntities;
      }

      return [];
    } catch (error: any) {
      console.error(`❌ Foundation search failed for "${query}":`, error.response?.status || error.message);
      return [];
    }
  }

  /**
   * Get specific foundation entity details
   */
  async getFoundationEntity(entityId: string): Promise<WHOApiEntity | null> {
    try {
      console.log(`🔍 Getting foundation entity: ${entityId}`);
      
      const response = await this.client.get(`/entity/${entityId}`, {
        params: {
          include: 'ancestor,descendant,diagnosticCriteria'
        }
      });

      if (response.data && response.data['@id']) {
        console.log(`✅ Retrieved foundation entity: ${response.data.title}`);
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error(`❌ Foundation entity failed for ${entityId}:`, error.response?.status || error.message);
      return null;
    }
  }

  /**
   * Complete NAMASTE integration workflow
   * 1. Search foundation for NAMASTE terms
   * 2. Look up foundation entities in linearization
   * 3. Get detailed code information
   */
  async integrateNAMASTETerm(namasteTerm: string): Promise<{
    foundationEntities: WHOApiEntity[];
    linearizationMappings: WHOApiLookupResult[];
    codeDetails: WHOApiCodeInfo[];
  }> {
    console.log(`🔄 Starting NAMASTE integration for: "${namasteTerm}"`);

    // Step 1: Search foundation for NAMASTE terms
    const foundationEntities = await this.searchFoundation(namasteTerm, '26'); // Chapter 26 for TM2

    // Step 2: Look up foundation entities in linearization
    const linearizationMappings: WHOApiLookupResult[] = [];
    for (const entity of foundationEntities) {
      const mapping = await this.lookupFoundationToLinearization(entity['@id']);
      if (mapping) {
        linearizationMappings.push(mapping);
      }
    }

    // Step 3: Get detailed code information
    const codeDetails: WHOApiCodeInfo[] = [];
    for (const mapping of linearizationMappings) {
      if (mapping.code) {
        const codeInfo = await this.getCodeInfo(mapping.code);
        if (codeInfo) {
          codeDetails.push(codeInfo);
        }
      }
    }

    console.log(`✅ NAMASTE integration completed:`);
    console.log(`   📊 Foundation entities: ${foundationEntities.length}`);
    console.log(`   📊 Linearization mappings: ${linearizationMappings.length}`);
    console.log(`   📊 Code details: ${codeDetails.length}`);

    return {
      foundationEntities,
      linearizationMappings,
      codeDetails
    };
  }
}
