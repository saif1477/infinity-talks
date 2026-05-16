import path from 'path';
import Database from 'better-sqlite3';
import axios from 'axios';
import { pipeline } from '@xenova/transformers';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * AUTOMATED WIKIPEDIA INGESTION SCRIPT
 * Usage: npx ts-node scripts/ingest_wikipedia.ts <expert_id> "<wikipedia_title>"
 * Example: npx ts-node scripts/ingest_wikipedia.ts steve-jobs "Steve Jobs"
 */

const DB_PATH = path.join(process.cwd(), 'assets/knowledge.db');

async function fetchWikipediaText(title: string): Promise<string> {
  // Use MediaWiki Action API with extracts — most reliable endpoint
  const url = 'https://en.wikipedia.org/w/api.php';
  const params = {
    action: 'query',
    titles: title,
    prop: 'extracts',
    explaintext: '1',    // Plain text, no HTML
    exlimit: '1',
    format: 'json',
    origin: '*',          // CORS support
  };

  const response = await axios.get(url, {
    params,
    headers: {
      'User-Agent': 'InfinityTalksBot/1.0 (https://github.com/saif1477/infinity-talks)',
      'Accept': 'application/json',
    },
  });

  const pages = response.data.query.pages;
  const pageId = Object.keys(pages)[0];

  if (pageId === '-1') {
    throw new Error(`Wikipedia page "${title}" not found.`);
  }

  const extract = pages[pageId].extract;
  if (!extract || extract.length < 100) {
    throw new Error(`Wikipedia page "${title}" has insufficient content (${extract?.length || 0} chars).`);
  }

  return extract;
}

async function ingest() {
  const expertId = process.argv[2];
  const wikiTitle = process.argv[3];

  if (!expertId || !wikiTitle) {
    console.error('❌ Missing arguments.');
    console.error('   Usage: npx ts-node scripts/ingest_wikipedia.ts <expert_id> "<wiki_title>"');
    process.exit(1);
  }

  console.log(`🌐 Fetching Wikipedia content for: "${wikiTitle}"...`);

  try {
    // 1. Fetch Wikipedia Content
    const cleanText = await fetchWikipediaText(wikiTitle);
    console.log(`✅ Fetched ${cleanText.length} characters.`);

    // 2. Chunking with LangChain RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunks = await splitter.splitText(cleanText);
    console.log(`🔍 Split into ${chunks.length} chunks (500 chars, 50 overlap).`);

    // 3. Initialize Embedding Pipeline
    console.log('🧠 Loading MiniLM-L6-v2 embedder...');
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // 4. Setup Database
    const db = new Database(DB_PATH);
    const insert = db.prepare('INSERT INTO knowledge (expert_id, content, embedding) VALUES (?, ?, ?)');

    console.log(`💾 Inserting ${chunks.length} chunks for expert: ${expertId}...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      const output = await embedder(chunk, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      // Convert to Float32Array blob for SQLite storage
      const buffer = Buffer.from(new Float32Array(vector).buffer);

      insert.run(expertId, chunk, buffer);

      // Progress indicator
      process.stdout.write(`\r  Progress: ${i + 1}/${chunks.length}`);
    }

    db.close();
    console.log(`\n\n✅ Successfully ingested "${wikiTitle}" → ${expertId} (${chunks.length} chunks)\n`);

  } catch (error: any) {
    console.error('❌ Ingestion failed:', error.message);
  }
}

ingest().catch(console.error);
