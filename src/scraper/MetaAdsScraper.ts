import puppeteer, { Browser, Page } from 'puppeteer';
import { AdData, GraphQLResponse } from '../types';

export class MetaAdsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private graphQLResponses: any[] = [];

  async initialize(): Promise<any> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      protocolTimeout: 180000
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await this.page.setRequestInterception(true);
    
    this.page.on('request', request => {
      request.continue();
    });

    this.page.on('response', async response => {
      const url = response.url();
      
      if (url.includes('/api/graphql')) {
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            if (this.containsAdData(data)) {
              this.graphQLResponses.push(data);
            }
          }
        } catch (error) {
          // Ignore JSON parse errors
        }
      }
    });
  }

  private containsAdData(data: any): boolean {
    try {
      if (data?.data?.ad_library_main) return true;
      if (data?.data?.page?.ad_library_page_search_result_ads) return true;
      return false;
    } catch {
      return false;
    }
  }

  async scrapeAds(url: string, maxAds?: number): Promise<AdData[]> {
    if (!this.page) throw new Error('Scraper not initialized');

    this.graphQLResponses = [];
    const allAds: AdData[] = [];
    let lastAdCount = 0;
    let noNewAdsCount = 0;
    const maxNoNewAdsAttempts = 5;

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.waitForAds();

      while (true) {
        const ads = this.extractAdsFromResponses();
        const uniqueAds = this.deduplicateAds([...allAds, ...ads]);
        
        console.log(`Collected ${uniqueAds.length} unique ads so far...`);

        if (maxAds && uniqueAds.length >= maxAds) {
          return uniqueAds.slice(0, maxAds);
        }

        if (uniqueAds.length === lastAdCount) {
          noNewAdsCount++;
          if (noNewAdsCount >= maxNoNewAdsAttempts) {
            console.log('No new ads found after multiple attempts. Stopping.');
            break;
          }
        } else {
          noNewAdsCount = 0;
          lastAdCount = uniqueAds.length;
          allAds.length = 0;
          allAds.push(...uniqueAds);
        }

        const hasMore = await this.scrollAndWait();
        if (!hasMore) {
          console.log('Reached end of page.');
          break;
        }

        await this.delay(2000);
      }

      return allAds;
    } catch (error) {
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async waitForAds(): Promise<void> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      if (this.graphQLResponses.length > 0) return;
      await this.delay(1000);
    }
  }

  private async scrollAndWait(): Promise<boolean> {
    if (!this.page) return false;

    const previousHeight = await this.page.evaluate(() => document.body.scrollHeight);
    
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await this.delay(2000);

    const newHeight = await this.page.evaluate(() => document.body.scrollHeight);
    return newHeight > previousHeight;
  }

  private extractAdsFromResponses(): AdData[] {
    const ads: AdData[] = [];

    for (const response of this.graphQLResponses) {
      try {
        const adData = 
          response?.data?.ad_library_main?.search_results?.edges ||
          response?.data?.page?.ad_library_page_search_result_ads?.edges ||
          [];

        for (const edge of adData) {
          const node = edge?.node;
          if (node && node.ad_archive_id) {
            ads.push(this.normalizeAdData(node));
          }
        }
      } catch (error) {
        console.warn('Error extracting ad data:', error);
      }
    }

    return ads;
  }

  private normalizeAdData(rawAd: any): AdData {
    return {
      ad_archive_id: rawAd.ad_archive_id,
      page_id: rawAd.page_id || rawAd.page?.id,
      page_name: rawAd.page_name || rawAd.page?.name,
      is_active: rawAd.is_active ?? 1,
      ad_creation_time: rawAd.ad_creation_time,
      ad_creative_bodies: rawAd.ad_creative_bodies,
      ad_creative_link_captions: rawAd.ad_creative_link_captions,
      ad_creative_link_descriptions: rawAd.ad_creative_link_descriptions,
      ad_creative_link_titles: rawAd.ad_creative_link_titles,
      ad_delivery_start_time: rawAd.ad_delivery_start_time,
      ad_delivery_stop_time: rawAd.ad_delivery_stop_time,
      ad_snapshot_url: rawAd.ad_snapshot_url,
      currency: rawAd.currency,
      spend: rawAd.spend,
      impressions: rawAd.impressions,
      ...rawAd
    };
  }

  private deduplicateAds(ads: AdData[]): AdData[] {
    const seen = new Map();
    for (const ad of ads) {
      seen.set(ad.ad_archive_id, ad);
    }
    return Array.from(seen.values());
  }

  private delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}