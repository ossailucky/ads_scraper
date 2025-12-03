import { StorageManager } from '../src/storage/StorageManager';
import { AdData, PageMetadata } from '../src/types';
import * as fs from 'fs/promises';

const TEST_DATA_DIR = './test_ads_data';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager(TEST_DATA_DIR);
  });

  afterEach(async () => {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  });

  test('should save and retrieve ad', async () => {
    const ad: AdData = {
      ad_archive_id: 'test_123',
      page_id: 'page_123',
      page_name: 'Test Page',
      is_active: 1,
      ad_creation_time: '2024-01-01T00:00:00Z',
      ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
      ad_snapshot_url: 'https://test.com'
    };

    await storage.saveAd(ad);
    const retrieved = await storage.getAd('page_123', 'test_123');

    expect(retrieved).toBeTruthy();
    expect(retrieved?.ad_archive_id).toBe('test_123');
  });
});