
export interface AdData {
  ad_archive_id: string;
  page_id: string;
  page_name: string;
  is_active: number;
  ad_creation_time: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string | null;
  ad_snapshot_url: string;
  currency?: string;
  spend?: {
    lower_bound: string;
    upper_bound: string;
  };
  impressions?: {
    lower_bound: string;
    upper_bound: string;
  };
  [key: string]: any;
}

export interface PageMetadata {
  page_id: string;
  page_name: string;
  last_synced: string;
  total_ads: number;
  active_ads: number;
  inactive_ads: number;
}

export interface SyncResult {
  success: boolean;
  totalFetched: number;
  errors: string[];
  pageId: string;
}

export interface GraphQLResponse {
  data: any;
}