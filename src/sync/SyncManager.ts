import { StorageManager } from '../storage/StorageManager';
import { MetaAdsScraper } from '../scraper/MetaAdsScraper';
import { SyncResult, PageMetadata, AdData } from '../types';

export class SyncManager {
  private storage: StorageManager;
  private scraper: MetaAdsScraper;

  constructor(storageDir?: string) {
    this.storage = new StorageManager(storageDir);
    this.scraper = new MetaAdsScraper();
  }

  async initialSync(url: string, max?: number): Promise<any> {
    console.log(`Starting initial sync from URL: ${url}`);
    console.log(`Max ads limit: ${max || 'unlimited'}`);

    const errors: string[] = [];
    let pageId = '';
    let totalFetched = 0;

    try {
      await this.scraper.initialize();

      const ads = await this.scraper.scrapeAds(url, max);
      totalFetched = ads.length;

      console.log(`Fetched ${totalFetched} ads. Saving to database...`);

      if (ads.length === 0) {
        throw new Error('No ads found. URL may be invalid or page has no ads.');
      }

      pageId = ads[0].page_id;
      const pageName = ads[0].page_name;

      for (const ad of ads) {
        try {
          await this.storage.saveAd(ad);
        } catch (error) {
          errors.push(`Failed to save ad ${ad.ad_archive_id}: ${error}`);
        }
      }

      const activeAds = ads.filter(ad => ad.is_active === 1).length;
      const inactiveAds = ads.length - activeAds;

      const metadata: PageMetadata = {
        page_id: pageId,
        page_name: pageName,
        last_synced: new Date().toISOString(),
        total_ads: ads.length,
        active_ads: activeAds,
        inactive_ads: inactiveAds
      };

      await this.storage.saveMetadata(metadata);

      console.log(`Initial sync complete!`);
      console.log(`Total ads: ${totalFetched}`);
      console.log(`Active: ${activeAds}, Inactive: ${inactiveAds}`);

      return {
        success: true,
        totalFetched,
        errors,
        pageId
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      console.error('Initial sync failed:', errorMsg);

      return {
        success: false,
        totalFetched,
        errors,
        pageId
      };
    } finally {
      await this.scraper.close();
    }
  }

  async incrementalSync(pageId: string): Promise<any> {
    console.log(`Starting incremental sync for page: ${pageId}`);

    const errors: string[] = [];
    let totalFetched = 0;

    try {
      const metadata = await this.storage.getMetadata(pageId);
      if (!metadata) {
        throw new Error(`No metadata found for page ${pageId}. Run initial sync first.`);
      }

      const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${pageId}`;

      await this.scraper.initialize();
      const ads = await this.scraper.scrapeAds(url);
      totalFetched = ads.length;

      console.log(`Fetched ${totalFetched} ads from live library.`);

      const existingAds = await this.storage.getAllAds(pageId);
      const existingAdIds = new Set(existingAds.map(ad => ad.ad_archive_id));

      let newAds = 0;
      let updatedAds = 0;

      for (const ad of ads) {
        try {
          if (existingAdIds.has(ad.ad_archive_id)) {
            const existingAd = await this.storage.getAd(pageId, ad.ad_archive_id);
            if (existingAd && this.hasChanged(existingAd, ad)) {
              await this.storage.saveAd(ad);
              updatedAds++;
            }
          } else {
            await this.storage.saveAd(ad);
            newAds++;
          }
        } catch (error) {
          errors.push(`Failed to process ad ${ad.ad_archive_id}: ${error}`);
        }
      }

      const liveAdIds = new Set(ads.map(ad => ad.ad_archive_id));
      for (const existingAd of existingAds) {
        if (!liveAdIds.has(existingAd.ad_archive_id) && existingAd.is_active === 1) {
          await this.storage.updateAdStatus(pageId, existingAd.ad_archive_id, {
            is_active: 0,
            ad_delivery_stop_time: new Date().toISOString()
          });
          updatedAds++;
        }
      }

      const activeAds = ads.filter(ad => ad.is_active === 1).length;
      const updatedMetadata: PageMetadata = {
        ...metadata,
        last_synced: new Date().toISOString(),
        total_ads: existingAds.length + newAds,
        active_ads: activeAds,
        inactive_ads: existingAds.length + newAds - activeAds
      };

      await this.storage.saveMetadata(updatedMetadata);

      console.log(`Incremental sync complete!`);
      console.log(`New ads: ${newAds}, Updated ads: ${updatedAds}`);

      return {
        success: true,
        totalFetched,
        errors,
        pageId
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      console.error('Incremental sync failed:', errorMsg);

      return {
        success: false,
        totalFetched,
        errors,
        pageId
      };
    } finally {
      await this.scraper.close();
    }
  }

  private hasChanged(oldAd: AdData, newAd: AdData): boolean {
    return (
      oldAd.is_active !== newAd.is_active ||
      oldAd.ad_delivery_stop_time !== newAd.ad_delivery_stop_time ||
      JSON.stringify(oldAd.spend) !== JSON.stringify(newAd.spend) ||
      JSON.stringify(oldAd.impressions) !== JSON.stringify(newAd.impressions)
    );
  }
}