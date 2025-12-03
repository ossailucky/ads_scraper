import * as fs from 'fs/promises';
import * as path from 'path';
import { AdData, PageMetadata } from '../types';

export class StorageManager {
  private baseDir: string;

  constructor(baseDir: string = './ads_data') {
    this.baseDir = baseDir;
  }

  private getPageDir(pageId: string): string {
    return path.join(this.baseDir, pageId);
  }

  private getMetadataPath(pageId: string): string {
    return path.join(this.getPageDir(pageId), 'metadata.json');
  }

  private getAdPath(pageId: string, adId: string): string {
    return path.join(this.getPageDir(pageId), `${adId}.json`);
  }

  async ensurePageDir(pageId: string): Promise<void> {
    const dir = this.getPageDir(pageId);
    await fs.mkdir(dir, { recursive: true });
  }

  async saveAd(ad: AdData): Promise<void> {
    const pageId = ad.page_id;
    await this.ensurePageDir(pageId);
    const adPath = this.getAdPath(pageId, ad.ad_archive_id);
    await fs.writeFile(adPath, JSON.stringify(ad, null, 2));
  }

  async getAd(pageId: string, adId: string): Promise<null | AdData> {
    try {
      const adPath = this.getAdPath(pageId, adId);
      const content = await fs.readFile(adPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async getAllAds(pageId: string): Promise<AdData[]> {
    try {
      const dir = this.getPageDir(pageId);
      const files = await fs.readdir(dir);
      const adFiles = files.filter(f => f.endsWith('.json') && f !== 'metadata.json');
      
      const ads: AdData[] = [];
      for (const file of adFiles) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        ads.push(JSON.parse(content));
      }
      return ads;
    } catch (error) {
      return [];
    }
  }

  async saveMetadata(metadata: PageMetadata): Promise<void> {
    await this.ensurePageDir(metadata.page_id);
    const metadataPath = this.getMetadataPath(metadata.page_id);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async getMetadata(pageId: string): Promise<null | PageMetadata> {
    try {
      const metadataPath = this.getMetadataPath(pageId);
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async updateAdStatus(pageId: string, adId: string, updates: Partial<AdData>): Promise<void> {
    const ad = await this.getAd(pageId, adId);
    if (ad) {
      const updatedAd = { ...ad, ...updates };
      await this.saveAd(updatedAd);
    }
  }
}