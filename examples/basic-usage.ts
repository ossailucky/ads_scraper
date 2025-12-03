import { SyncManager } from '../src';

async function basicExample() {
  const syncManager = new SyncManager();
  
  // Initial sync
  const url = 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=YOUR_PAGE_ID';
  const result = await syncManager.initialSync(url, 50);
  
  console.log('Sync completed:', result);
}

basicExample().catch(console.error);