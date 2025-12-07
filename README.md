# Meta Ads Library Scraper

A robust Node.js/TypeScript system for scraping and managing Meta (Facebook) Ads Library data with support for initial and incremental syncing.

## Features

-  **Efficient Scraping**: Uses Puppeteer to intercept GraphQL API responses
-  **Local JSON Database**: Organized by page_id for easy management
-  **Incremental Sync**: Keep your database up-to-date without re-fetching everything
-  **Comprehensive Testing**: Full test suite to catch API changes
-  **Error Handling**: Robust error handling including timeouts
-  **Fast & Reliable**: Optimized for performance even with large datasets

## Installation

```bash
# Install dependencies (uses latest stable versions)
npm install

# Build the project
npm run build
```


## Usage

### Initial Sync

Fetch all ads from a Meta Ads Library page:

```typescript
import { SyncManager } from './src/index';

const syncManager = new SyncManager();

// Fetch all ads (no limit)
const url = 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=YOUR_PAGE_ID';
const result = await syncManager.initialSync(url);

// Fetch with a limit
const limitedResult = await syncManager.initialSync(url, 100);
```

### Incremental Sync

Keep your local database in sync with the live library:

```typescript
// Sync a specific page
const result = await syncManager.incrementalSync('YOUR_PAGE_ID');

console.log(`Updated ${result.totalFetched} ads`);
```

### Working with Stored Data

```typescript
import { StorageManager } from './src/index';

const storage = new StorageManager();

// Get all ads for a page
const ads = await storage.getAllAds('YOUR_PAGE_ID');

// Get specific ad
const ad = await storage.getAd('YOUR_PAGE_ID', 'AD_ARCHIVE_ID');

// Get page metadata
const metadata = await storage.getMetadata('YOUR_PAGE_ID');
```

## Data Structure

### Ad Data (AdData)

```typescript
{
  ad_archive_id: string;           // Unique ad identifier
  page_id: string;                 // Page ID
  page_name: string;               // Page name
  is_active: number;               // 1 = active, 0 = inactive
  ad_creation_time: string;        // ISO 8601 timestamp
  ad_delivery_start_time: string;  // ISO 8601 timestamp
  ad_delivery_stop_time?: string;  // ISO 8601 timestamp (if inactive)
  ad_snapshot_url: string;         // URL to ad snapshot
  ad_creative_bodies?: string[];   // Ad text content
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  currency?: string;               // e.g., "USD"
  spend?: {
    lower_bound: string;
    upper_bound: string;
  };
  impressions?: {
    lower_bound: string;
    upper_bound: string;
  };
}
```

### Page Metadata (PageMetadata)

```typescript
{
  page_id: string;
  page_name: string;
  last_synced: string;    // ISO 8601 timestamp
  total_ads: number;
  active_ads: number;
  inactive_ads: number;
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Error Handling

The system includes comprehensive error handling:

- Network timeouts (60s default)
- GraphQL API changes detection
- File system errors
- Invalid URLs
- Missing data

All errors are captured and returned in the `SyncResult`:

```typescript
{
  success: boolean;
  totalFetched: number;
  errors: string[];
  pageId: string;
}
```

## How It Works

1. **GraphQL Interception**: Puppeteer intercepts Meta's GraphQL API responses that contain ad data
2. **Progressive Loading**: Scrolls the page to trigger loading of more ads
3. **Deduplication**: Ensures no duplicate ads are stored
4. **Incremental Updates**: Compares live data with stored data to identify changes
5. **Status Tracking**: Automatically marks ads as inactive when they're no longer live

## Best Practices

1. **Rate Limiting**: Don't run syncs too frequently (recommended: once per hour minimum)
2. **Error Monitoring**: Always check the `errors` array in results
3. **Backup**: Keep backups of your `ads_data` directory
4. **Testing**: Run tests after updating dependencies to catch API changes
5. **Limits**: Use the `max` parameter during development to avoid long waits

## Limitations

- Requires a stable internet connection
- Meta may implement rate limiting or blocking
- GraphQL API structure may change (tests help detect this)
- Images/videos are not downloaded (only URLs are stored)

## Troubleshooting

### No ads found
- Verify the URL is correct
- Check that the page has published ads
- Ensure you have internet connectivity

### Timeout errors
- Increase timeout in Puppeteer configuration
- Check your internet speed
- Try a smaller `max` value first

### Tests failing
- Meta may have changed their GraphQL API
- Update the scraper logic to match new structure
- Check the test output for specific failures

## Contributing

1. Run tests before submitting: `npm test`
2. Ensure TypeScript compiles: `npm run build`
3. Follow the existing code style
4. Add tests for new features