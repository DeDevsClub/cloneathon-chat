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
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  news?: {
    results: BraveSearchResult[];
  };
}

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

      const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&text_decorations=0&search_lang=en&country=US&safesearch=moderate&freshness=pd`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
      }

      const data: BraveSearchResponse = await response.json();
      
      const webResults = data.web?.results || [];
      const newsResults = data.news?.results || [];
      
      // Combine and format results
      const formattedResults = [
        ...webResults.slice(0, 6).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description,
          type: 'web' as const,
          age: result.age || result.page_age,
        })),
        ...newsResults.slice(0, 2).map(result => ({
          title: result.title,
          url: result.url,
          description: result.description,
          type: 'news' as const,
          age: result.age || result.page_age,
        }))
      ];

      return {
        query: query,
        results: formattedResults,
        timestamp: new Date().toISOString(),
        source: 'brave',
        total_results: webResults.length + newsResults.length
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
