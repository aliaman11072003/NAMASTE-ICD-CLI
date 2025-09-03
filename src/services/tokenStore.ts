export interface TokenRecord {
  token: string;
  expiresAt: number;
  fetchedAt: number;
}

export interface TokenStore {
  get(): Promise<TokenRecord | null>;
  set(record: TokenRecord): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory token store (default)
 */
export class InMemoryTokenStore implements TokenStore {
  private tokenRecord: TokenRecord | null = null;

  async get(): Promise<TokenRecord | null> {
    return this.tokenRecord;
  }

  async set(record: TokenRecord): Promise<void> {
    this.tokenRecord = record;
  }

  async clear(): Promise<void> {
    this.tokenRecord = null;
  }
}

/**
 * MongoDB-backed token store
 */
export class MongoTokenStore implements TokenStore {
  private collection: any;

  constructor() {
    // Lazy initialization to avoid circular dependencies
    this.collection = null;
  }

  private async getCollection() {
    if (!this.collection) {
      try {
        const { default: mongoose } = await import('mongoose');
        const db = mongoose.connection;
        
        if (db.readyState !== 1) {
          throw new Error('MongoDB connection not ready');
        }

        // Define schema for token storage
        const tokenSchema = new mongoose.Schema({
          provider: { type: String, required: true, unique: true },
          token: { type: String, required: true },
          expiresAt: { type: Number, required: true },
          fetchedAt: { type: Number, required: true }
        });

        this.collection = db.model('APIToken', tokenSchema);
        console.log('📊 Using MongoDB token store');
      } catch (error) {
        console.error('❌ Failed to initialize MongoDB token store:', error);
        throw new Error('MongoDB token store initialization failed');
      }
    }
    return this.collection;
  }

  async get(): Promise<TokenRecord | null> {
    try {
      const collection = await this.getCollection();
      const doc = await collection.findOne({ provider: 'icd' });
      
      if (doc) {
        return {
          token: doc.token,
          expiresAt: doc.expiresAt,
          fetchedAt: doc.fetchedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error reading token from MongoDB:', error);
      return null;
    }
  }

  async set(record: TokenRecord): Promise<void> {
    try {
      const collection = await this.getCollection();
      await collection.findOneAndUpdate(
        { provider: 'icd' },
        {
          provider: 'icd',
          token: record.token,
          expiresAt: record.expiresAt,
          fetchedAt: record.fetchedAt
        },
        { upsert: true, new: true }
      );
      console.log('💾 Token persisted to MongoDB');
    } catch (error) {
      console.error('❌ Error writing token to MongoDB:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const collection = await this.getCollection();
      await collection.deleteOne({ provider: 'icd' });
      console.log('🗑️  Token cleared from MongoDB');
    } catch (error) {
      console.error('❌ Error clearing token from MongoDB:', error);
      // Don't throw on clear errors
    }
  }
}
