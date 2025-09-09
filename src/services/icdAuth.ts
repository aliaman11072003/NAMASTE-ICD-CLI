import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenStore, InMemoryTokenStore, MongoTokenStore } from './tokenStore';
import { ensureHttps } from '../utils/httpsUtil';

export interface ICDAuthConfig {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  tokenStore: TokenStore;
}

export class ICDAuthService {
  private static instance: ICDAuthService;
  private config: ICDAuthConfig;
  private currentRefreshPromise: Promise<string> | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelays = [300, 900, 2700]; // Exponential backoff in ms

  private constructor(config: ICDAuthConfig) {
    this.config = config;
  }

  public static getInstance(config?: Partial<ICDAuthConfig>): ICDAuthService {
    if (!ICDAuthService.instance) {
      const defaultConfig: ICDAuthConfig = {
        clientId: process.env.ICD_CLIENT_ID || '',
        clientSecret: process.env.ICD_CLIENT_SECRET || '',
        tokenEndpoint: process.env.ICD_TOKEN_ENDPOINT || 'https://icdaccessmanagement.who.int/connect/token',
        tokenStore: process.env.TOKEN_STORE === 'mongo' ? new MongoTokenStore() : new InMemoryTokenStore()
      };

      if (!defaultConfig.clientId || !defaultConfig.clientSecret) {
        throw new Error('ICD_CLIENT_ID and ICD_CLIENT_SECRET are required environment variables');
      }

      ICDAuthService.instance = new ICDAuthService(defaultConfig);
    }
    return ICDAuthService.instance;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  public async getAccessToken(forceRefresh: boolean = false): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (!forceRefresh) {
        const cached = await this.config.tokenStore.get();
        if (cached && Date.now() < cached.expiresAt) {
          console.log('🔑 Using cached access token');
          return cached.token;
        }
      }

      // If there's already a refresh in progress, wait for it
      if (this.currentRefreshPromise) {
        console.log('⏳ Token refresh already in progress, waiting...');
        return await this.currentRefreshPromise;
      }

      // Start a new refresh
      this.currentRefreshPromise = this.refreshToken();
      const token = await this.currentRefreshPromise;
      this.currentRefreshPromise = null;
      return token;

    } catch (error) {
      this.currentRefreshPromise = null;
      throw error;
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshToken(): Promise<string> {
    console.log('🔑 Refreshing access token...');
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Debug: Log what we're sending (without exposing secrets)
        console.log(`🔍 Sending request to: ${this.config.tokenEndpoint}`);
        console.log(`🔍 Client ID: ${this.config.clientId.substring(0, 20)}...`);
        console.log(`🔍 Using Basic auth with scope parameter`);
        
        // Use Basic Authentication with client credentials and scope parameter
        const response = await axios.post(
          ensureHttps(this.config.tokenEndpoint),
          new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'icdapi_access'
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json, application/ld+json'
            },
            auth: {
              username: this.config.clientId,
              password: this.config.clientSecret
            },
            timeout: 10000
          }
        );

        if (response.data && response.data.access_token) {
          const token = response.data.access_token;
          const expiresIn = response.data.expires_in || 3600;
          const expiresAt = Date.now() + (expiresIn - 10) * 1000; // 10 second grace period
          
          // Store the token
          await this.config.tokenStore.set({
            token,
            expiresAt,
            fetchedAt: Date.now()
          });

          console.log(`✅ Access token refreshed successfully, expires in ${expiresIn} seconds`);
          return token;
        } else {
          throw new Error('No access_token in response');
        }

      } catch (error) {
        if (attempt === this.maxRetries) {
          throw this.formatTokenError(error);
        }

        if (this.shouldRetry(error)) {
          const delay = this.retryDelays[attempt];
          console.log(`⚠️  Token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          throw this.formatTokenError(error);
        }
      }
    }

    throw new Error('Token refresh failed after maximum retries');
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      // Retry on network errors, 5xx errors, and 429 (rate limit)
      return !status || (status >= 500) || status === 429;
    }
    return true; // Retry on non-HTTP errors
  }

  /**
   * Format token errors for better debugging
   */
  private formatTokenError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const data = error.response?.data;
      
      let message = `Token refresh failed: ${status} ${statusText}`;
      if (data) {
        if (typeof data === 'object' && data.error) {
          message += ` - ${data.error}`;
          // Log additional error details for debugging
          if (data.error_description) {
            message += ` (${data.error_description})`;
          }
          if (data.error_uri) {
            message += ` - See: ${data.error_uri}`;
          }
        } else if (typeof data === 'string') {
          message += ` - ${data.substring(0, 100)}`;
        }
      }
      
      // Log the full response for debugging
      console.error('🔍 Full error response:', JSON.stringify(data, null, 2));
      
      return new Error(message);
    }
    
    return new Error(`Token refresh failed: ${error.message}`);
  }

  /**
   * Create an Axios client with automatic authentication
   */
  public createAxiosClient(baseURL?: string): AxiosInstance {
    const client = axios.create({
      baseURL: baseURL ? ensureHttps(baseURL) : undefined,
      timeout: 30000,
      headers: {
        'API-Version': 'v2',
        'Accept': 'application/json, application/ld+json',
        'Accept-Language': 'en',
        'User-Agent': 'NAMASTE-ICD-CLI/1.0.0'
      }
    });

    // Request interceptor to add Authorization header
    client.interceptors.request.use(async (config) => {
      try {
        const token = await this.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      } catch (error) {
        console.error('❌ Failed to get access token for request:', error);
        throw error;
      }
    });

    // Response interceptor to handle 401 errors
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log('🔄 Received 401, attempting token refresh...');
          
          try {
            // Force refresh the token
            await this.getAccessToken(true);
            
            // Retry the original request
            const originalRequest = error.config;
            if (originalRequest) {
              const token = await this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
          }
        }
        
        throw error;
      }
    );

    return client;
  }

  /**
   * Clear the token cache
   */
  public async clearTokenCache(): Promise<void> {
    await this.config.tokenStore.clear();
    this.currentRefreshPromise = null;
    console.log('🗑️  Token cache cleared');
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export convenience functions
export const getAccessToken = (forceRefresh?: boolean): Promise<string> => {
  return ICDAuthService.getInstance().getAccessToken(forceRefresh);
};

export const createAxiosClient = (baseURL?: string): AxiosInstance => {
  return ICDAuthService.getInstance().createAxiosClient(baseURL);
};

export const clearTokenCache = (): Promise<void> => {
  return ICDAuthService.getInstance().clearTokenCache();
};
