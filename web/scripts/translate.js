import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Regex to match Chinese characters
const chineseRegex = /[\u4e00-\u9fa5]+/g;

// Translation cache file path
const CACHE_FILE = path.join(__dirname, 'translations-cache.json');

// Load existing translations from cache file
function loadTranslationCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return new Map(Object.entries(JSON.parse(data)));
    }
  } catch (error) {
    console.warn('Failed to load translation cache:', error);
  }
  return new Map();
}

// Save translations to cache file
function saveTranslationCache(cache) {
  try {
    const data = JSON.stringify(Object.fromEntries(cache), null, 2);
    fs.writeFileSync(CACHE_FILE, data, 'utf8');
    console.log('✓ Saved translations to cache file');
  } catch (error) {
    console.error('Failed to save translation cache:', error);
  }
}

// Translation cache
const translationCache = loadTranslationCache();

// Sleep function for rate limiting
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to translate text using OpenAI with retries
async function translateWithGPT4(texts, retryCount = 3) {
  const uniqueTexts = [...new Set(texts)].filter(text => !translationCache.has(text));
  
  if (uniqueTexts.length === 0) {
    return texts.map(text => translationCache.get(text) || text);
  }

  console.log('\nTranslating batch:');
  uniqueTexts.forEach((text, i) => console.log(`${i + 1}. "${text}"`));

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator specializing in Chinese to English translation. Translate the following Chinese texts to English. Maintain the original meaning and context. Return ONLY the translations, one per line, in the exact same order.'
            },
            {
              role: 'user',
              content: uniqueTexts.join('\n')
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const translations = data.choices?.[0]?.message?.content?.trim().split('\n') || [];
      
      if (translations.length !== uniqueTexts.length) {
        console.warn(`Warning: Received ${translations.length} translations for ${uniqueTexts.length} texts`);
      }

      // Handle line count mismatch by padding with original text
      while (translations.length < uniqueTexts.length) {
        translations.push(uniqueTexts[translations.length]);
      }

      // Update cache with new translations and save immediately
      console.log('\nTranslations received:');
      uniqueTexts.forEach((text, index) => {
        if (translations[index] && translations[index].trim()) {
          const translation = translations[index].trim();
          translationCache.set(text, translation);
          console.log(`✓ "${text}" -> "${translation}"`);
        }
      });
      saveTranslationCache(translationCache);

      return texts.map(text => translationCache.get(text) || text);
    } catch (error) {
      console.error(`Translation attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === retryCount - 1) {
        console.error('Translation failed after all retries');
        return texts;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.log(`Waiting ${delay}ms before retry ${attempt + 1}/${retryCount}...`);
      await sleep(delay);
    }
  }
  return texts;
}

// Function to process batches with rate limiting
async function processBatchesWithRateLimit(items, batchSize, processor) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results = [];
  for (let i = 0; i < batches.length; i++) {
    console.log(`\nProcessing batch ${i + 1}/${batches.length}...`);
    const result = await processor(batches[i]);
    results.push(result);
    
    // Rate limiting: wait between batches
    if (i < batches.length - 1) {
      console.log('Waiting 1 second before next batch...');
      await sleep(1000);
    }
  }

  return results.flat();
}

// Function to safely escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to collect all Chinese strings from a file
function collectChineseStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.match(chineseRegex) || [];
}

// Function to apply translations to a file
function applyTranslations(filePath, translations) {
  let content = fs.readFileSync(filePath, 'utf8');
  const backup = `${filePath}.bak`;
  
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, content);
  }

  // Sort translations by length (longest first) to handle nested strings correctly
  const sortedTranslations = Object.entries(translations)
    .sort(([a], [b]) => b.length - a.length);

  let translationsApplied = false;
  for (const [chinese, english] of sortedTranslations) {
    if (english && english !== chinese) {
      const regex = new RegExp(escapeRegExp(chinese), 'g');
      const newContent = content.replace(regex, english);
      if (newContent !== content) {
        content = newContent;
        translationsApplied = true;
        console.log(`  Applied: "${chinese}" -> "${english}"`);
      }
    }
  }

  if (translationsApplied) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Function to get all JS/JSX files
function getAllJSFiles(dir) {
  const files = [];
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !entry.includes('node_modules')) {
        traverse(fullPath);
      } else if (
        stat.isFile() && 
        (entry.endsWith('.js') || entry.endsWith('.jsx')) &&
        !entry.endsWith('.test.js') &&
        !entry.endsWith('.spec.js')
      ) {
        files.push(fullPath);
      }
    }
  }
  traverse(dir);
  return files;
}

// Main function
async function main() {
  const srcDir = path.join(path.dirname(__dirname), 'src');
  console.log('Starting translation using GPT-4o...\n');

  // Get all JS files
  const files = getAllJSFiles(srcDir);
  console.log(`Found ${files.length} JS/JSX files\n`);

  // Collect all Chinese strings from all files
  console.log('Collecting Chinese strings...');
  const allStrings = new Set();
  for (const file of files) {
    const strings = collectChineseStrings(file);
    strings.forEach(str => allStrings.add(str));
  }

  const stringArray = [...allStrings];
  console.log(`\nFound ${stringArray.length} unique Chinese strings:`);
  stringArray.forEach((str, i) => console.log(`${i + 1}. "${str}"`));

  if (stringArray.length === 0) {
    console.log('No Chinese strings found to translate.');
    return;
  }

  // Process translations in batches with rate limiting
  console.log('\nTranslating strings...');
  const batchSize = 5; // Smaller batch size for better visibility
  const translatedStrings = await processBatchesWithRateLimit(
    stringArray,
    batchSize,
    async batch => translateWithGPT4(batch)
  );

  // Create translation map
  const translations = new Map();
  stringArray.forEach((chinese, index) => {
    if (translatedStrings[index] && translatedStrings[index] !== chinese) {
      translations.set(chinese, translatedStrings[index]);
    }
  });

  if (translations.size === 0) {
    console.log('No translations were generated. Check if the API is working correctly.');
    return;
  }

  // Apply translations to all files
  console.log('\nApplying translations to files...');
  let filesChanged = 0;
  for (const file of files) {
    console.log(`\nProcessing ${path.relative(srcDir, file)}...`);
    try {
      const changed = applyTranslations(file, Object.fromEntries(translations));
      if (changed) {
        filesChanged++;
        console.log(`✓ Successfully updated file`);
      } else {
        console.log('No changes needed for this file');
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('\nTranslation completed!');
  console.log(`Modified ${filesChanged} files`);
  console.log('Translations saved to translations-cache.json');
  console.log('Backup files created with .bak extension');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});