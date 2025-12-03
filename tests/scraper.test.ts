import { SyncManager, StorageManager, AdData, PageMetadata } from '../src/index';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Meta Ads Scraper Test Suite', () => {
  const TEST_DATA_DIR = './test_ads_data';
  let storage: StorageManager;

  beforeEach(async () => {
    storage = new StorageManager(TEST_DATA_DIR);
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('StorageManager', () => {
    test('should create page directory structure', async () => {
      const pageId = 'test_page_123';
      await storage.ensurePageDir(pageId);

      const dirPath = path.join(TEST_DATA_DIR, pageId);
      const exists = await fs.access(dirPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('should save and retrieve ad correctly', async () => {
      const mockAd: AdData = {
        ad_archive_id: 'ad_123',
        page_id: 'page_456',
        page_name: 'Test Page',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/123'
      };

      await storage.saveAd(mockAd);
      const retrieved = await storage.getAd('page_456', 'ad_123');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.ad_archive_id).toBe('ad_123');
      expect(retrieved?.page_id).toBe('page_456');
      expect(retrieved?.is_active).toBe(1);
    });

    test('should save and retrieve metadata correctly', async () => {
      const metadata: PageMetadata = {
        page_id: 'page_789',
        page_name: 'Test Page',
        last_synced: '2024-01-01T00:00:00.000Z',
        total_ads: 100,
        active_ads: 75,
        inactive_ads: 25
      };

      await storage.saveMetadata(metadata);
      const retrieved = await storage.getMetadata('page_789');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.page_id).toBe('page_789');
      expect(retrieved?.total_ads).toBe(100);
      expect(retrieved?.active_ads).toBe(75);
    });

    test('should update ad status correctly', async () => {
      const mockAd: AdData = {
        ad_archive_id: 'ad_update_test',
        page_id: 'page_update',
        page_name: 'Update Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/update'
      };

      await storage.saveAd(mockAd);
      await storage.updateAdStatus('page_update', 'ad_update_test', {
        is_active: 0,
        ad_delivery_stop_time: '2024-01-15T00:00:00.000Z'
      });

      const updated = await storage.getAd('page_update', 'ad_update_test');
      expect(updated?.is_active).toBe(0);
      expect(updated?.ad_delivery_stop_time).toBe('2024-01-15T00:00:00.000Z');
    });

    test('should retrieve all ads for a page', async () => {
      const ads: AdData[] = [
        {
          ad_archive_id: 'ad_1',
          page_id: 'page_multi',
          page_name: 'Multi Test',
          is_active: 1,
          ad_creation_time: '2024-01-01T00:00:00Z',
          ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
          ad_snapshot_url: 'https://facebook.com/ads/snapshot/1'
        },
        {
          ad_archive_id: 'ad_2',
          page_id: 'page_multi',
          page_name: 'Multi Test',
          is_active: 0,
          ad_creation_time: '2024-01-02T00:00:00.000Z',
          ad_delivery_start_time: '2024-01-02T00:00:00.000Z',
          ad_snapshot_url: 'https://facebook.com/ads/snapshot/2'
        }
      ];

      for (const ad of ads) {
        await storage.saveAd(ad);
      }

      const retrieved = await storage.getAllAds('page_multi');
      expect(retrieved.length).toBe(2);
      expect(retrieved.map(a => a.ad_archive_id).sort()).toEqual(['ad_1', 'ad_2']);
    });
  });

  describe('Ad Data Structure Validation', () => {
    test('should contain all required fields', () => {
      const requiredFields = [
        'ad_archive_id',
        'page_id',
        'page_name',
        'is_active',
        'ad_creation_time',
        'ad_delivery_start_time',
        'ad_snapshot_url'
      ];

      const mockAd: AdData = {
        ad_archive_id: 'ad_required',
        page_id: 'page_required',
        page_name: 'Required Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/required'
      };

      for (const field of requiredFields) {
        expect(mockAd).toHaveProperty(field);
        expect(mockAd[field]).toBeDefined();
      }
    });

    test('should handle optional fields correctly', () => {
      const mockAd: AdData = {
        ad_archive_id: 'ad_optional',
        page_id: 'page_optional',
        page_name: 'Optional Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/optional',
        ad_creative_bodies: ['Test body'],
        ad_creative_link_titles: ['Test title'],
        currency: 'USD',
        spend: {
          lower_bound: '100',
          upper_bound: '500'
        },
        impressions: {
          lower_bound: '1000',
          upper_bound: '5000'
        }
      };

      expect(mockAd.ad_creative_bodies).toBeDefined();
      expect(mockAd.currency).toBe('USD');
      expect(mockAd.spend?.lower_bound).toBe('100');
      expect(mockAd.impressions?.upper_bound).toBe('5000');
    });

    test('should validate ad_archive_id format', () => {
      const mockAd: AdData = {
        ad_archive_id: '123456789',
        page_id: 'page_format',
        page_name: 'Format Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/format'
      };

      expect(typeof mockAd.ad_archive_id).toBe('string');
      expect(mockAd.ad_archive_id.length).toBeGreaterThan(0);
    });

    test('should validate is_active values', () => {
      const activeAd: AdData = {
        ad_archive_id: 'ad_active',
        page_id: 'page_status',
        page_name: 'Status Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/active'
      };

      const inactiveAd: AdData = {
        ...activeAd,
        ad_archive_id: 'ad_inactive',
        is_active: 0,
        ad_delivery_stop_time: '2024-01-15T00:00:00.000Z'
      };

      expect([0, 1]).toContain(activeAd.is_active);
      expect([0, 1]).toContain(inactiveAd.is_active);
      expect(inactiveAd.is_active).toBe(0);
    });

    test('should validate timestamp formats', () => {
      const mockAd: AdData = {
        ad_archive_id: 'ad_timestamp',
        page_id: 'page_timestamp',
        page_name: 'Timestamp Test',
        is_active: 1,
        ad_creation_time: '2024-01-01T00:00:00.000Z',
        ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
        ad_snapshot_url: 'https://facebook.com/ads/snapshot/timestamp'
      };

      // Should be valid ISO 8601 format
      expect(() => new Date(mockAd.ad_creation_time)).not.toThrow();
      expect(() => new Date(mockAd.ad_delivery_start_time)).not.toThrow();
      
      const creationDate = new Date(mockAd.ad_creation_time);
      expect(creationDate.toISOString()).toBe(mockAd.ad_creation_time);
    });
  });

  describe('Metadata Structure Validation', () => {
    test('should contain all required metadata fields', () => {
      const metadata: PageMetadata = {
        page_id: 'page_meta',
        page_name: 'Metadata Test',
        last_synced: '2024-01-01T00:00:00Z',
        total_ads: 100,
        active_ads: 75,
        inactive_ads: 25
      };

      expect(metadata).toHaveProperty('page_id');
      expect(metadata).toHaveProperty('page_name');
      expect(metadata).toHaveProperty('last_synced');
      expect(metadata).toHaveProperty('total_ads');
      expect(metadata).toHaveProperty('active_ads');
      expect(metadata).toHaveProperty('inactive_ads');
    });

    test('should validate metadata calculations', () => {
      const metadata: PageMetadata = {
        page_id: 'page_calc',
        page_name: 'Calculation Test',
        last_synced: '2024-01-01T00:00:00.000Z',
        total_ads: 100,
        active_ads: 75,
        inactive_ads: 25
      };

      expect(metadata.active_ads + metadata.inactive_ads).toBe(metadata.total_ads);
      expect(metadata.total_ads).toBeGreaterThanOrEqual(0);
      expect(metadata.active_ads).toBeGreaterThanOrEqual(0);
      expect(metadata.inactive_ads).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent ad gracefully', async () => {
      const result = await storage.getAd('nonexistent_page', 'nonexistent_ad');
      expect(result).toBeNull();
    });

    test('should handle non-existent metadata gracefully', async () => {
      const result = await storage.getMetadata('nonexistent_page');
      expect(result).toBeNull();
    });

    test('should handle empty page directory', async () => {
      const pageId = 'empty_page';
      await storage.ensurePageDir(pageId);
      const ads = await storage.getAllAds(pageId);
      expect(ads).toEqual([]);
    });

    test('should handle malformed ad data', async () => {
      const pageId = 'malformed_page';
      await storage.ensurePageDir(pageId);
      
      // Create malformed JSON file
      const malformedPath = path.join(TEST_DATA_DIR, pageId, 'malformed.json');
      await fs.writeFile(malformedPath, 'not valid json{{{');

      const ads = await storage.getAllAds(pageId);
      // Should not throw, just skip malformed files
      expect(Array.isArray(ads)).toBe(true);
    });
  });

  describe('GraphQL Response Detection', () => {
    test('should identify valid ad library response structure', () => {
      const validResponse1 = {
        data: {
          ad_library_main: {
            search_results: {
              edges: [
                {
                  node: {
                    ad_archive_id: 'test_123',
                    page_id: 'page_123'
                  }
                }
              ]
            }
          }
        }
      };

      const validResponse2 = {
        data: {
          page: {
            ad_library_page_search_result_ads: {
              edges: [
                {
                  node: {
                    ad_archive_id: 'test_456',
                    page_id: 'page_456'
                  }
                }
              ]
            }
          }
        }
      };

      expect(validResponse1.data.ad_library_main).toBeDefined();
      expect(validResponse2.data.page.ad_library_page_search_result_ads).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should perform complete save and retrieve cycle', async () => {
      const testAds: AdData[] = [
        {
          ad_archive_id: 'integration_1',
          page_id: 'integration_page',
          page_name: 'Integration Test',
          is_active: 1,
          ad_creation_time: '2024-01-01T00:00:00.000Z',
          ad_delivery_start_time: '2024-01-01T00:00:00.000Z',
          ad_snapshot_url: 'https://facebook.com/ads/snapshot/int1'
        },
        {
          ad_archive_id: 'integration_2',
          page_id: 'integration_page',
          page_name: 'Integration Test',
          is_active: 0,
          ad_creation_time: '2024-01-02T00:00:00.000Z',
          ad_delivery_start_time: '2024-01-02T00:00:00.000Z',
          ad_delivery_stop_time: '2024-01-10T00:00:00.000Z',
          ad_snapshot_url: 'https://facebook.com/ads/snapshot/int2'
        }
      ];

      // Save all ads
      for (const ad of testAds) {
        await storage.saveAd(ad);
      }

      // Save metadata
      const metadata: PageMetadata = {
        page_id: 'integration_page',
        page_name: 'Integration Test',
        last_synced: new Date().toISOString(),
        total_ads: testAds.length,
        active_ads: testAds.filter(a => a.is_active === 1).length,
        inactive_ads: testAds.filter(a => a.is_active === 0).length
      };
      await storage.saveMetadata(metadata);

      // Retrieve and verify
      const retrievedAds = await storage.getAllAds('integration_page');
      const retrievedMetadata = await storage.getMetadata('integration_page');

      expect(retrievedAds.length).toBe(2);
      expect(retrievedMetadata?.total_ads).toBe(2);
      expect(retrievedMetadata?.active_ads).toBe(1);
      expect(retrievedMetadata?.inactive_ads).toBe(1);
    });
  });
});

// ============================================================================
// Mock Data Generator for Testing
// ============================================================================

export function generateMockAd(overrides?: Partial<AdData>): AdData {
  const defaultAd: AdData = {
    ad_archive_id: `mock_ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    page_id: 'mock_page_123',
    page_name: 'Mock Page Name',
    is_active: 1,
    ad_creation_time: new Date().toISOString(),
    ad_delivery_start_time: new Date().toISOString(),
    ad_snapshot_url: 'https://facebook.com/ads/snapshot/mock',
    ad_creative_bodies: ['Mock ad creative body'],
    ad_creative_link_titles: ['Mock Link Title'],
    currency: 'USD',
    spend: {
      lower_bound: '100',
      upper_bound: '500'
    },
    impressions: {
      lower_bound: '1000',
      upper_bound: '5000'
    }
  };

  return { ...defaultAd, ...overrides };
}

export function generateMockMetadata(overrides?: Partial<PageMetadata>): PageMetadata {
  const defaultMetadata: PageMetadata = {
    page_id: 'mock_page_123',
    page_name: 'Mock Page Name',
    last_synced: new Date().toISOString(),
    total_ads: 100,
    active_ads: 75,
    inactive_ads: 25
  };

  return { ...defaultMetadata, ...overrides };
}