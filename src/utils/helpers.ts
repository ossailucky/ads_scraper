export function delay(ms: number): Promise<Date> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  export function isValidPageId(pageId: string): boolean {
    return /^\d+$/.test(pageId);
  }
  
  export function extractPageIdFromUrl(url: string): string | null {
    const match = url.match(/view_all_page_id=(\d+)/);
    return match ? match[1] : null;
  }
  
  export function formatTimestamp(date: Date): string {
    return date.toISOString();
  }