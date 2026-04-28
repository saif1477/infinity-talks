import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * PHASE 2: DATA HARVESTER
 * This script fetches open-source knowledge for the 12 experts.
 * Run with: npx ts-node scripts/harvestData.ts
 */

const RAW_DATA_PATH = path.join(process.cwd(), 'data/raw_knowledge');

interface ExpertSource {
  id: string;
  sources: {
    name: string;
    url: string;
    type: 'wiki' | 'gutenberg' | 'transcript';
  }[];
}

const EXPERT_SOURCES: ExpertSource[] = [
  {
    id: 'steve-jobs',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Steve_Jobs', type: 'wiki' },
      { name: 'Stanford Commencement Speech', url: 'https://raw.githubusercontent.com/casey-chow/stanford-commencement-speeches/master/2005-steve-jobs.txt', type: 'transcript' }
    ]
  },
  {
    id: 'albert-einstein',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Albert_Einstein', type: 'wiki' },
      { name: 'Relativity: Special and General Theory', url: 'https://www.gutenberg.org/cache/epub/30155/pg30155.txt', type: 'gutenberg' }
    ]
  },
  {
    id: 'isaac-newton',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Isaac_Newton', type: 'wiki' },
      { name: 'Philosophiae Naturalis Principia Mathematica', url: 'https://www.gutenberg.org/files/28496/28496-t/28496-t.tex', type: 'gutenberg' }
    ]
  },
  {
    id: 'marie-curie',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Marie_Curie', type: 'wiki' },
      { name: 'Radioactive Substances', url: 'https://www.gutenberg.org/cache/epub/1639/pg1639.txt', type: 'gutenberg' }
    ]
  },
  {
    id: 'nikola-tesla',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Nikola_Tesla', type: 'wiki' },
      { name: 'My Inventions', url: 'https://www.gutenberg.org/cache/epub/1340/pg1340.txt', type: 'gutenberg' }
    ]
  },
  {
    id: 'elon-musk',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Elon_Musk', type: 'wiki' }
    ]
  },
  {
    id: 'mark-zuckerberg',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Mark_Zuckerberg', type: 'wiki' }
    ]
  },
  {
    id: 'sundar-pichai',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Sundar_Pichai', type: 'wiki' }
    ]
  },
  {
    id: 'bill-gates',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Bill_Gates', type: 'wiki' }
    ]
  },
  {
    id: 'warren-buffett',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Warren_Buffett', type: 'wiki' }
    ]
  },
  {
    id: 'stephen-hawking',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/Stephen_Hawking', type: 'wiki' }
    ]
  },
  {
    id: 'oppenheimer',
    sources: [
      { name: 'Wikipedia Summary', url: 'https://en.wikipedia.org/api/rest_v1/page/summary/J._Robert_Oppenheimer', type: 'wiki' }
    ]
  }
];

async function harvest() {
  console.log('🚀 Starting Data Harvest...');

  if (!fs.existsSync(RAW_DATA_PATH)) {
    fs.mkdirSync(RAW_DATA_PATH, { recursive: true });
  }

  for (const expert of EXPERT_SOURCES) {
    const expertDir = path.join(RAW_DATA_PATH, expert.id);
    if (!fs.existsSync(expertDir)) {
      fs.mkdirSync(expertDir);
    }

    console.log(`\n📂 Harvesting data for: ${expert.id}`);

    for (const source of expert.sources) {
      try {
        console.log(`  🔗 Fetching ${source.name}...`);
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'InfinityTalks/1.0 (contact: your@email.com) Axios/1.0'
          }
        });
        
        let content = '';
        if (source.type === 'wiki') {
          content = response.data.extract;
        } else {
          content = response.data;
        }

        const fileName = source.name.toLowerCase().replace(/ /g, '_') + '.txt';
        fs.writeFileSync(path.join(expertDir, fileName), content);
        console.log(`  ✅ Saved ${fileName}`);
      } catch (error) {
        console.error(`  ❌ Failed to fetch ${source.name}:`, (error as Error).message);
      }
    }
  }

  console.log('\n✨ Harvest Complete! Check /data/raw_knowledge');
}

harvest();
