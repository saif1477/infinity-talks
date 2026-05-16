import path from 'path';
import Database from 'better-sqlite3';

/**
 * DEBUG SCRIPT: Inspect knowledge.db contents
 * Usage: npx ts-node scripts/check_db.ts
 */

const DB_PATH = path.join(process.cwd(), 'assets/knowledge.db');

function check() {
  const db = new Database(DB_PATH, { readonly: true });

  // 1. Total chunks per expert
  console.log('═══════════════════════════════════════');
  console.log('  📊 KNOWLEDGE DB — CHUNK COUNTS');
  console.log('═══════════════════════════════════════');

  const counts = db.prepare(
    'SELECT expert_id, COUNT(*) as total FROM knowledge GROUP BY expert_id ORDER BY total DESC'
  ).all() as { expert_id: string; total: number }[];

  if (counts.length === 0) {
    console.log('\n  ⚠️  Database is EMPTY. No chunks found.\n');
    db.close();
    return;
  }

  let grandTotal = 0;
  for (const row of counts) {
    console.log(`  ${row.expert_id.padEnd(20)} → ${row.total} chunks`);
    grandTotal += row.total;
  }
  console.log('───────────────────────────────────────');
  console.log(`  TOTAL                    → ${grandTotal} chunks`);
  console.log('═══════════════════════════════════════\n');

  // 2. Preview first 2 chunks for steve-jobs
  console.log('  🔍 PREVIEW: steve-jobs (first 2 chunks)');
  console.log('───────────────────────────────────────');

  const preview = db.prepare(
    'SELECT content FROM knowledge WHERE expert_id = ? LIMIT 2'
  ).all('steve-jobs') as { content: string }[];

  if (preview.length === 0) {
    console.log('  No data found for steve-jobs.');
  } else {
    preview.forEach((row, i) => {
      console.log(`\n  [Chunk ${i + 1}]`);
      console.log(`  ${row.content.substring(0, 200)}...`);
    });
  }

  console.log('\n═══════════════════════════════════════\n');
  db.close();
}

check();
