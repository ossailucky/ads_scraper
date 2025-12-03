export { SyncManager } from './sync/SyncManager';
export { StorageManager } from './storage/StorageManager';
export { MetaAdsScraper } from './scraper/MetaAdsScraper';
export * from './types';
export * from './utils/helpers';

// Main execution example
async function main() {
  const { SyncManager } = await import('./sync/SyncManager');
  const syncManager = new SyncManager();

  const url = process.env.ADS_LIBRARY_URL || '';
  const maxAds = process.env.MAX_ADS ? parseInt(process.env.MAX_ADS) : undefined;

  if (!url) {
    console.error('Please provide ADS_LIBRARY_URL environment variable');
    process.exit(1);
  }

  const result = await syncManager.initialSync(url, maxAds);
  console.log('Sync result:', result);
}