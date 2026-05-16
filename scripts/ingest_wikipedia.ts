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

async function ingest() {
  const expertId = process.argv[2];
  const wikiTitle = process.argv[3];

  if (!expertId || !wikiTitle) {
    console.error('❌ Missing arguments. Usage: npx ts-node scripts/ingest_wikipedia.ts <expert_id> "<wiki_title>"');
    process.exit(1);
  }

  console.log(`🌐 Fetching Wikipedia content for: "${wikiTitle}"...`);

  try {
    // 1. Fetch Wikipedia Content (Plain Text)
    // Using the REST API for clean, section-based content
    const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(wikiTitle)}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'InfinityTalksBot/1.0 (contact@infinity-talks.com)' }
    });

    // Combine lead and remaining sections, strip HTML tags
    let rawHtml = '';
    response.data.lead.sections.forEach((s: any) => rawHtml += s.text);
    response.data.remaining.sections.forEach((s: any) => rawHtml += s.text);
    
    const cleanText = rawHtml.replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`✅ Fetched ${cleanText.length} characters.`);

    // 2. Chunking with LangChain RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunks = await splitter.splitText(cleanText);
    console.log(`🔍 Split into ${chunks.length} chunks with 50-character overlap.`);

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

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\rProgress: ${i + 1}/${chunks.length}`);
      }
    }

    db.close();
    console.log(`\n\n✅ Successfully ingested "${wikiTitle}" into the knowledge base for ${expertId}.`);

  } catch (error: any) {
    console.error('❌ Ingestion failed:', error.message);
    if (error.response?.status === 404) {
      console.error('  Hint: Wikipedia page not found. Check the title spelling.');
    }
  }
}

ingest().catch(console.error);
