import { pipeline } from '@xenova/transformers';

/**
 * RAGService — Web-Compatible Edition
 * Uses sql.js WASM (web build) to load knowledge.db via HTTP fetch.
 * This replaces the broken expo-file-system approach that fails on web/Vercel.
 */

// Dynamic import of sql.js to avoid bundler issues with node:fs
async function loadSqlJs() {
  // Use the CDN-hosted WASM build to avoid Node.js dependencies
  const sqlPromise = await fetch('https://sql.js.org/dist/sql-wasm.js');
  const sqlText = await sqlPromise.text();
  
  // Create a blob URL and import it
  const blob = new Blob([sqlText], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  
  // Execute the script in global scope
  const script = document.createElement('script');
  script.src = blobUrl;
  
  return new Promise<any>((resolve, reject) => {
    script.onload = () => {
      // sql.js exposes initSqlJs on window
      const initSqlJs = (window as any).initSqlJs;
      if (initSqlJs) {
        resolve(initSqlJs);
      } else {
        reject(new Error('initSqlJs not found after loading sql-wasm.js'));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

class RAGService {
  private static instance: RAGService;
  private db: any = null;
  private embedder: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize() {
    try {
      console.log('[RAGService] Initializing (Web-compatible mode)...');

      // 1. Load sql.js WASM engine from CDN
      const initSqlJs = await loadSqlJs();
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // 2. Fetch the knowledge.db file via HTTP
      let dbBuffer: ArrayBuffer | null = null;
      const paths = [
        '/assets/knowledge.db',
        './assets/knowledge.db',
      ];

      for (const path of paths) {
        try {
          console.log(`[RAGService] Trying to fetch DB from: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            dbBuffer = await response.arrayBuffer();
            console.log(`[RAGService] ✅ Loaded DB from ${path} (${(dbBuffer.byteLength / 1024).toFixed(1)} KB)`);
            break;
          }
        } catch (e) {
          // Try next path
        }
      }

      if (!dbBuffer) {
        throw new Error('Could not fetch knowledge.db from any known path.');
      }

      this.db = new SQL.Database(new Uint8Array(dbBuffer));
      console.log('[RAGService] ✅ SQLite database opened successfully.');

      // Verify data exists
      const countResult = this.db.exec('SELECT COUNT(*) as total FROM knowledge');
      const totalChunks = countResult[0]?.values[0]?.[0] || 0;
      console.log(`[RAGService] 📊 Database contains ${totalChunks} chunks.`);

      // 3. Load Embedding Pipeline
      console.log('[RAGService] Loading MiniLM-L6-v2 embedder...');
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[RAGService] ✅ Embedder model loaded.');

      this.isInitialized = true;
    } catch (error) {
      console.error('[RAGService] ❌ Initialization failed:', error);
      this.initPromise = null;
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
      const stmt = this.db.prepare('SELECT content, embedding FROM knowledge WHERE expert_id = ?');
      stmt.bind([expertId]);

      const rows: { content: string; embedding: Uint8Array }[] = [];
      while (stmt.step()) {
        const row = stmt.get();
        rows.push({ content: row[0] as string, embedding: row[1] as Uint8Array });
      }
      stmt.free();

      if (rows.length === 0) {
        console.log(`[RAGService] ⚠️ No chunks found for expert: ${expertId}`);
        return '';
      }

      // 3. Cosine Similarity search
      const scoredChunks = rows.map((row) => {
        const chunkVector = Array.from(new Float32Array(row.embedding.buffer));
        const score = this.cosineSimilarity(queryVector, chunkVector);
        return { content: row.content, score };
      });

      // 4. Sort and take top 3
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(c => c.content);

      console.log(`[RAGService] 🧠 Retrieved ${topChunks.length} context chunks for ${expertId}`);
      console.log('RETRIEVED CHUNKS:', topChunks);
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
