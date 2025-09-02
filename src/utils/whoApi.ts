import axios, { AxiosResponse } from 'axios';
import { WHOICDResponse, WHOICDEntity } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class WHOAPI {
  private static instance: WHOAPI;
  private baseUrl: string;
  private timeout: number;

  private constructor() {
    this.baseUrl = process.env.WHO_API_BASE_URL || 'https://id.who.int/icd/release/11/2023';
    this.timeout = parseInt(process.env.WHO_API_TIMEOUT || '10000');
  }

  public static getInstance(): WHOAPI {
    if (!WHOAPI.instance) {
      WHOAPI.instance = new WHOAPI();
    }
    return WHOAPI.instance;
  }

  /**
   * Search ICD-11 codes by keyword
   */
  public async searchCodes(query: string, type?: 'TM2' | 'Biomedicine'): Promise<WHOICDEntity[]> {
    try {
      console.log(`🔍 Searching WHO ICD-11 API for: "${query}"`);
      
      const searchUrl = `${this.baseUrl}/search`;
      const params: any = {
        q: query,
        propertiesToBeSearched: 'Title,Definition,Exclusion,Inclusion',
        useFlexisearch: true,
        flatResults: false
      };

      // Add type filter if specified
      if (type === 'TM2') {
        params.linearization = 'tm2';
      } else if (type === 'Biomedicine') {
        params.linearization = 'mms';
      }

      const response: AxiosResponse<WHOICDResponse> = await axios.get(searchUrl, {
        params,
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NAMASTE-ICD-CLI/1.0.0'
        }
      });

      if (response.data && response.data.destinationEntities) {
        console.log(`✅ Found ${response.data.destinationEntities.length} ICD-11 codes for "${query}"`);
        return response.data.destinationEntities;
      } else {
        console.log(`⚠️ No ICD-11 codes found for "${query}"`);
        return [];
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(`❌ WHO API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          console.error('❌ WHO API request failed - no response received');
        } else {
          console.error(`❌ WHO API error: ${error.message}`);
        }
      } else {
        console.error('❌ Unexpected error during WHO API call:', error);
      }
      return [];
    }
  }

  /**
   * Get specific ICD-11 code details
   */
  public async getCodeDetails(codeId: string): Promise<WHOICDEntity | null> {
    try {
      console.log(`🔍 Fetching details for ICD-11 code: ${codeId}`);
      
      const detailUrl = `${this.baseUrl}/content/${codeId}`;
      
      const response: AxiosResponse<WHOICDEntity> = await axios.get(detailUrl, {
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NAMASTE-ICD-CLI/1.0.0'
        }
      });

      if (response.data) {
        console.log(`✅ Retrieved details for ICD-11 code: ${codeId}`);
        return response.data;
      } else {
        console.log(`⚠️ No details found for ICD-11 code: ${codeId}`);
        return null;
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(`❌ WHO API error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
          console.error('❌ WHO API request failed - no response received');
        } else {
          console.error(`❌ WHO API error: ${error.message}`);
        }
      } else {
        console.error('❌ Unexpected error during WHO API call:', error);
      }
      return null;
    }
  }

  /**
   * Search for TM2 codes specifically
   */
  public async searchTM2Codes(query: string): Promise<WHOICDEntity[]> {
    return this.searchCodes(query, 'TM2');
  }

  /**
   * Search for Biomedicine codes specifically
   */
  public async searchBiomedicineCodes(query: string): Promise<WHOICDEntity[]> {
    return this.searchCodes(query, 'Biomedicine');
  }

  /**
   * Get API status
   */
  public async getAPIStatus(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NAMASTE-ICD-CLI/1.0.0'
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Format search results for display
   */
  public formatSearchResults(entities: WHOICDEntity[], type: 'TM2' | 'Biomedicine'): string {
    if (entities.length === 0) {
      return `No ICD-11 ${type} codes found.`;
    }

    let result = `\n📋 ICD-11 ${type} Codes Found (${entities.length}):\n`;
    result += '─'.repeat(80) + '\n';

    entities.forEach((entity, index) => {
      result += `${index + 1}. Code: ${entity.id}\n`;
      result += `   Title: ${entity.title}\n`;
      if (entity.definition) {
        result += `   Definition: ${entity.definition.substring(0, 100)}${entity.definition.length > 100 ? '...' : ''}\n`;
      }
      if (entity.inclusion && entity.inclusion.length > 0) {
        result += `   Inclusion: ${entity.inclusion[0].substring(0, 80)}${entity.inclusion[0].length > 80 ? '...' : ''}\n`;
      }
      result += '\n';
    });

    return result;
  }
}

export default WHOAPI.getInstance();
