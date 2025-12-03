import { AdData, PageMetadata } from '../../src/types';

export function generateMockAd(overrides?: Partial<AdData>): AdData {
  return {
    ad_archive_id: `ad_${Date.now()}`,
    page_id: 'mock_page',
    page_name: 'Mock Page',
    is_active: 1,
    ad_creation_time: new Date().toISOString(),
    ad_delivery_start_time: new Date().toISOString(),
    ad_snapshot_url: 'https://mock.com',
    ...overrides
  };
}

export function generateMockMetadata(overrides?: Partial<AdData>): PageMetadata {
  return {
    page_id: 'mock_page',
    page_name: 'Mock Page',
    last_synced: new Date().toISOString(),
    total_ads: 100,
    active_ads: 75,
    inactive_ads: 25,
    ...overrides
  };
}