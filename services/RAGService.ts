import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { pipeline } from '@xenova/transformers';

/**
 * RAGService
 * Handles semantic search over the local knowledge.db.
 */

class RAGService {
  private static instance: RAGService;
  private db: any = null;
  private embedder: any = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Initialize the RAG engine:
   * 1. Copy bundled knowledge.db to readable location.
   * 2. Load the embedding model.
   */
  public async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('[RAGService] Initializing...');

      // 1. Prepare SQLite Database from Assets
      const dbName = 'knowledge.db';
      const dbFile = `\${FileSystem.documentDirectory}SQLite/\${dbName}`;
      
      const dbFolder = `\${FileSystem.documentDirectory}SQLite`;
      if (!(await FileSystem.getInfoAsync(dbFolder)).exists) {
        await FileSystem.makeDirectoryAsync(dbFolder);
      }

      const asset = Asset.fromModule(require('../assets/knowledge.db'));
      await asset.downloadAsync();
      await FileSystem.copyAsync({
        from: asset.localUri!,
        to: dbFile,
      });

      this.db = await SQLite.openDatabaseAsync(dbName);
      console.log('[RAGService] ✅ Database ready.');

      // 2. Load Embedding Pipeline
      // Using MiniLM-L6-v2 (same as build script)
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        device: 'webgpu' // Fallback to cpu handled by library
      });
      console.log('[RAGService] ✅ Embedder model loaded.');

      this.isInitialized = true;
    } catch (error) {
      console.error('[RAGService] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Finds the top 3 most relevant chunks for a given expert and query.
   */
  public async getRelevantContext(expertId: string, query: string): Promise<string> {
    if (!this.isInitialized) await this.initialize();

    try {
      // 1. Embed user query
      const output = await this.embedder(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(output.data) as number[];

      // 2. Fetch chunks for this expert
      const rows: any = await this.db.getAllAsync(
        'SELECT content, embedding FROM knowledge WHERE expert_id = ?',
        [expertId]
      );

      if (rows.length === 0) return '';

      // 3. Perform Cosine Similarity in memory
      // (Fast for the 100-1000 chunks typically fetched)
      const scoredChunks = rows.map((row: any) => {
        const chunkVector = Array.from(new Float32Array(row.embedding.buffer));
        const score = this.cosineSimilarity(queryVector, chunkVector);
        return { content: row.content, score };
      });

      // 4. Sort and take top 3
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => c.content);

      console.log(`[RAGService] 🧠 Retrieved \${topChunks.length} context chunks for \${expertId}`);
      return topChunks.join('\n\n');
    } catch (error) {
      console.error('[RAGService] ❌ Context retrieval failed:', error);
      return '';
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const ragService = RAGService.getInstance();
