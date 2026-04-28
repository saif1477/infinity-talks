import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { pipeline } from '@xenova/transformers';

/**
 * PHASE 3: VECTOR DB BUILDER
 * This script chunks text, generates embeddings, and saves them to SQLite.
 * Run with: npx ts-node scripts/buildVectorDB.ts
 */

const RAW_DATA_PATH = path.join(process.cwd(), 'data/raw_knowledge');
const DB_PATH = path.join(process.cwd(), 'assets/knowledge.db');

async function build() {
  console.log('🧠 Initializing Embedding Pipeline (all-MiniLM-L6-v2)...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('🗄️ Setting up SQLite Database...');
  
  // Ensure assets directory exists
  const assetsDir = path.dirname(DB_PATH);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Delete existing DB to start fresh
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);

  // Create table for expert knowledge
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expert_id TEXT,
      content TEXT,
      embedding BLOB
    );
  `);

  const insert = db.prepare('INSERT INTO knowledge (expert_id, content, embedding) VALUES (?, ?, ?)');

  const experts = fs.readdirSync(RAW_DATA_PATH);

  for (const expertId of experts) {
    const expertPath = path.join(RAW_DATA_PATH, expertId);
    if (!fs.statSync(expertPath).isDirectory()) continue;

    console.log(`\n📄 Processing Expert: ${expertId}`);
    const files = fs.readdirSync(expertPath);

    for (const file of files) {
      const filePath = path.join(expertPath, file);
      const text = fs.readFileSync(filePath, 'utf-8');

      // Simple chunking (approx 500 characters, can be refined to tokens)
      const chunks = chunkText(text, 500);
      console.log(`  🔍 Split ${file} into ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding
        const output = await embedder(chunk, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);
        
        // Save to DB as Float32Array blob
        const buffer = Buffer.from(new Float32Array(vector).buffer);
        insert.run(expertId, chunk, buffer);
        
        if ((i + 1) % 10 === 0) process.stdout.write('.');
      }
    }
  }

  db.close();
  console.log('\n\n✅ Vector DB build complete! File saved to assets/knowledge.db');
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  // Basic sliding window or simple split
  const sentences = text.split(/[.!?]\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}

build().catch(console.error);
