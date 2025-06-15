'use client';

import { useState } from 'react';
import { ExternalLink, Globe, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  type: 'web' | 'news';
  age?: string;
}

interface SearchResultsData {
  query: string;
  results: SearchResult[];
  timestamp: string;
  source: string;
  total_results?: number;
  error?: string;
}

interface SearchResultsProps {
  data: SearchResultsData;
}

function SearchResultCard({ result, index }: { result: SearchResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isLarge = index === 0 || index === 3; // Make first and fourth results larger
  const isWide = index === 1; // Make second result wide
  
  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 ${
        isLarge ? 'row-span-2' : ''
      } ${isWide ? 'col-span-2' : ''}`}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={result.type === 'news' ? 'destructive' : 'secondary'}
              className="text-xs px-2 py-1"
            >
              {result.type === 'news' ? '📰 News' : '🌐 Web'}
            </Badge>
            {result.age && (
              <Badge variant="outline" className="text-xs px-2 py-1 flex items-center gap-1">
                <Clock size={10} />
                {result.age}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
            onClick={() => window.open(result.url, '_blank')}
          >
            <ExternalLink size={12} />
          </Button>
        </div>
        
        <div className="flex-1">
          <h3 
            className="font-semibold text-sm leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => window.open(result.url, '_blank')}
          >
            {result.title}
          </h3>
          
          <p 
            className={`text-xs text-muted-foreground leading-relaxed ${
              isExpanded ? '' : isLarge ? 'line-clamp-4' : 'line-clamp-3'
            }`}
          >
            {result.description}
          </p>
          
          {result.description.length > 120 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-700"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>Show less <ChevronUp size={12} className="ml-1" /></>
              ) : (
                <>Show more <ChevronDown size={12} className="ml-1" /></>
              )}
            </Button>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-muted-foreground truncate">
            {new URL(result.url).hostname}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResults({ data }: SearchResultsProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (data.error) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <Search size={16} />
          <span className="font-medium">Search Error</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{data.error}</p>
      </div>
    );
  }

  if (!data.results || data.results.length === 0) {
    return (
      <div className="my-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Search size={16} />
          <span className="font-medium">No Results Found</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          No search results found for "{data.query}"
        </p>
      </div>
    );
  }

  const displayResults = showAll ? data.results : data.results.slice(0, 6);

  return (
    <div className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Search size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Search Results</h3>
              <p className="text-sm text-muted-foreground">
                Found {data.total_results || data.results.length} results for "{data.query}"
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1 flex items-center gap-1">
            <Globe size={10} />
            {data.source === 'brave' ? 'Brave Search' : 'Search'}
          </Badge>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
        {displayResults.map((result, index) => (
          <SearchResultCard key={`${result.url}-${index}`} result={result} index={index} />
        ))}
      </div>

      {/* Show More Button */}
      {data.results.length > 6 && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp size={16} />
              </>
            ) : (
              <>
                Show More ({data.results.length - 6} more) <ChevronDown size={16} />
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-muted-foreground text-center">
          Search completed at {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
