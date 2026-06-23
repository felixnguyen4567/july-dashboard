const GRAPH_API_VERSION = 'v22.0';

export class InstagramClient {
  private accessToken: string;
  private igAccountId: string;

  constructor() {
    this.accessToken = process.env.FB_PAGE_ACCESS_TOKEN || '';
    this.igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID || '';
  }

  /**
   * Test the Instagram API connection.
   * Verifies the IG Business Account is accessible.
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.accessToken || !this.igAccountId) {
      return {
        ok: false,
        message:
          'Instagram not configured. Set FB_PAGE_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID in .env.local.',
      };
    }

    try {
      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.igAccountId}?fields=username,name,ig_id&access_token=${this.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          message: `Instagram API error (${response.status}): ${data.error?.message || 'Unknown error'}`,
        };
      }

      return {
        ok: true,
        message: `Connected to @${data.username || data.name || data.ig_id}`,
      };
    } catch (err) {
      return {
        ok: false,
        message: `Instagram connection error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Publish content to Instagram.
   * Instagram requires media — text-only posts are not supported.
   *
   * @param caption The post caption text
   * @param imageUrl A publicly accessible image URL
   * @returns The published media ID
   * @throws Error if no imageUrl is provided or if the API call fails
   */
  async publishPhoto(caption: string, imageUrl: string): Promise<string> {
    if (!this.accessToken || !this.igAccountId) {
      throw new Error(
        'Instagram not configured. Set FB_PAGE_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID in .env.local.'
      );
    }

    // Clean and truncate caption to avoid "The caption was too long" error (max 2200 chars for Instagram)
    let cleanCaption = caption;
    if (cleanCaption.includes('=== CAROUSEL OUTLINE ===')) {
      cleanCaption = cleanCaption.split('=== CAROUSEL OUTLINE ===')[0];
    } else if (cleanCaption.includes('=== CAROUSEL OUTLINE')) {
      cleanCaption = cleanCaption.split('=== CAROUSEL OUTLINE')[0];
    }
    
    if (cleanCaption.includes('=== REEL OUTLINE ===')) {
      cleanCaption = cleanCaption.split('=== REEL OUTLINE ===')[0];
    } else if (cleanCaption.includes('=== REEL OUTLINE')) {
      cleanCaption = cleanCaption.split('=== REEL OUTLINE')[0];
    }
    
    if (cleanCaption.includes('=== REEL IDEA ===')) {
      cleanCaption = cleanCaption.split('=== REEL IDEA ===')[0];
    } else if (cleanCaption.includes('=== REEL IDEA')) {
      cleanCaption = cleanCaption.split('=== REEL IDEA')[0];
    }
    
    if (cleanCaption.includes('=== TIKTOK OUTLINE ===')) {
      cleanCaption = cleanCaption.split('=== TIKTOK OUTLINE ===')[0];
    } else if (cleanCaption.includes('=== TIKTOK OUTLINE')) {
      cleanCaption = cleanCaption.split('=== TIKTOK OUTLINE')[0];
    }

    cleanCaption = cleanCaption.trim();
    
    // Hard limit at 2190 characters to leave a tiny safety buffer
    if (cleanCaption.length > 2190) {
      cleanCaption = cleanCaption.slice(0, 2187) + '...';
    }

    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.igAccountId}/media`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: cleanCaption,
        access_token: this.accessToken,
      }),
    });

    const createData = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(
        `Instagram container creation failed: ${createData.error?.message || JSON.stringify(createData)}`
      );
    }

    const containerId = createData.id;

    // Step 2: Wait 8 seconds to allow Meta side to process the image
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Step 3: Publish the container with retries if still processing
    const publishUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.igAccountId}/media_publish`;
    let publishData: any;
    let published = false;

    for (let retry = 0; retry < 5; retry++) {
      const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: this.accessToken,
        }),
      });

      publishData = await publishResponse.json();

      if (publishResponse.ok) {
        published = true;
        break;
      }

      const errorMsg = publishData.error?.message || '';
      const errorCode = publishData.error?.code;

      // Code 9007 or message indicating media is not ready/still processing
      if (errorCode === 9007 || errorMsg.includes('processed') || errorMsg.includes('ready')) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        continue;
      }

      // Other error, fail immediately
      throw new Error(
        `Instagram publish failed: ${publishData.error?.message || JSON.stringify(publishData)}`
      );
    }

    if (!published) {
      throw new Error(
        `Instagram publish timed out: ${publishData?.error?.message || 'Media not processed in time.'}`
      );
    }

    return publishData.id;
  }
}
