import { SyncManager } from '../src';

async function basicExample() {
  const syncManager = new SyncManager();
  
  // Initial sync
  const url = 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=282592881929497';
  const result = await syncManager.initialSync(url, 50);
  
  console.log('Sync completed:', result);
}

basicExample().catch(console.error);