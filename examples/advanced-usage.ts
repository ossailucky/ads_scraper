import { SyncManager, StorageManager } from '../src';

interface InitialSyncResult {
  success: boolean;
  pageId: string;
}

async function advancedExample() {
  const storage = new StorageManager('./custom_data_dir');
  
  // Initial sync
  const url = 'YOUR_URL_HERE';
  const syncManager = new SyncManager();
  const initialResult: InitialSyncResult = await syncManager.initialSync(url);
  
  if (initialResult.success) {
    // Get all ads
    const ads = await storage.getAllAds(initialResult.pageId);
    console.log(`Stored ${ads.length} ads`);
    
    // Incremental sync
    const incrementalResult = await syncManager.incrementalSync(initialResult.pageId);
    console.log('Incremental sync:', incrementalResult);
  }
}

advancedExample().catch(console.error);