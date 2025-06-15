import { z } from 'zod';
import { tool } from 'ai';

const searchSchema = z.object({
  query: z.string().describe('The search query to execute'),
});

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  page_age?: string;
  family_friendly?: boolean;
  thumbnail?: {
    src: string;
    width?: number;
    height?: number;
  };
  meta_url?: {
    scheme: string;
    netloc: string;
    hostname: string;
    favicon: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  news?: {
    results: BraveSearchResult[];
  };
  images?: {
    results: BraveImageResult[];
  };
}

type BraveImageResult = {
  title: string;
  url: string;
  thumbnail: {
    src: string;
    width: number;
    height: number;
  };
  properties: {
    url: string;
    width: number;
    height: number;
  };
};

export const webSearchTool = tool({
  description: 'Search the web for current information using Brave Search API',
  parameters: searchSchema,
  execute: async ({ query }) => {
    try {
      console.log('Executing Brave Search for:', query);
      
      const apiKey = process.env.BRAVE_SEARCH_API_KEY;
      if (!apiKey) {
        console.warn('BRAVE_SEARCH_API_KEY not found, using placeholder results');
        return {
          query: query,
          results: [
            {
              title: `Search results for: ${query}`,
              url: '#',
              description: 'Brave Search API key not configured. Please add BRAVE_SEARCH_API_KEY to your environment variables.',
              type: 'web'
            }
          ],
          timestamp: new Date().toISOString(),
          source: 'placeholder'
        };
      }

      // Make concurrent requests for web and image results
      const [webResponse, imageResponse] = await Promise.all([
        fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&text_decorations=0&search_lang=en&country=US&safesearch=moderate&freshness=pd`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': apiKey,
          },
        }),
        fetch(`https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=6&safesearch=moderate`, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': apiKey,
          },
        })
      ]);

      if (!webResponse.ok) {
        throw new Error(`Brave Search API error: ${webResponse.status} ${webResponse.statusText}`);
      }

      const webData: BraveSearchResponse = await webResponse.json();
      const imageData = imageResponse.ok ? await imageResponse.json() : null;
      
      const webResults = webData.web?.results || [];
      const newsResults = webData.news?.results || [];
      const imageResults = imageData?.images?.results || [];
      
      // Combine and format results
      const formattedResults = [
        ...webResults.slice(0, 6).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description,
          type: 'web' as const,
          age: result.age || result.page_age,
          thumbnail: result.thumbnail,
          meta_url: result.meta_url,
        })),
        ...newsResults.slice(0, 2).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description,
          type: 'news' as const,
          age: result.age || result.page_age,
          thumbnail: result.thumbnail,
          meta_url: result.meta_url,
        })),
        ...imageResults.slice(0, 2).map((result: BraveImageResult) => ({
          title: result.title,
          url: result.url,
          description: '',
          type: 'image' as const,
          thumbnail: result.thumbnail,
          properties: result.properties,
        }))
      ];

      return {
        query: query,
        results: formattedResults,
        timestamp: new Date().toISOString(),
        source: 'brave',
        total_results: webResults.length + newsResults.length + imageResults.length
      };
    } catch (error) {
      console.error('Brave Search error:', error);
      return {
        query: query,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: [],
        timestamp: new Date().toISOString(),
        source: 'error'
      };
    }
  },
});
