'use client';

import { useState, useRef } from 'react';
import {
  ExternalLink,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  type: 'web' | 'news' | 'image';
  age?: string;
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
  properties?: {
    url: string;
    width: number;
    height: number;
  };
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

function SearchResultCarouselCard({
  result,
  index,
}: { result: SearchResult; index: number }) {
  const [imageError, setImageError] = useState(false);

  const getCardHeight = () => {
    if (result.type === 'image') return 'h-80';
    return result.thumbnail ? 'h-64' : 'h-48';
  };

  const getTypeIcon = () => {
    switch (result.type) {
      case 'news':
        return '📰';
      case 'image':
        return '🖼️';
      case 'web':
      default:
        return '🌐';
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case 'news':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'image':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'web':
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const handleCardClick = () => {
    window.open(result.url, '_blank');
  };

  return (
    <Card
      className={`shrink-0 w-80 ${getCardHeight()} group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 cursor-pointer overflow-hidden`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Section */}
        {(result.thumbnail || result.type === 'image') && !imageError && (
          <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={
                result.thumbnail?.src ||
                (result.type === 'image' ? result.url : '')
              }
              alt={result.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => setImageError(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`text-xs px-2 py-1 ${getTypeColor()}`}>
                  {getTypeIcon()}{' '}
                  {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                </Badge>
                {result.age && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-1 flex items-center gap-1 bg-black/20 text-white border-0"
                  >
                    <Clock size={10} />
                    {result.age}
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-sm leading-tight text-white line-clamp-2">
                {result.title}
              </h3>
            </div>

            {/* External Link Button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-8 w-8 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                window.open(result.url, '_blank');
              }}
            >
              <ExternalLink size={12} />
            </Button>
          </div>
        )}

        {/* Content Section */}
        <div
          className={`p-4 flex-1 flex flex-col ${(result.thumbnail || result.type === 'image') && !imageError ? '' : 'justify-center'}`}
        >
          {/* Header for non-image cards or when image fails */}
          {(!result.thumbnail && result.type !== 'image') || imageError ? (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs px-2 py-1 ${getTypeColor()}`}>
                  {getTypeIcon()}{' '}
                  {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                </Badge>
                {result.age && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <Clock size={10} />
                    {result.age}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 size-6"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(result.url, '_blank');
                }}
              >
                <ExternalLink size={12} />
              </Button>
            </div>
          ) : null}

          {/* Title for non-image cards or when image fails */}
          {(!result.thumbnail && result.type !== 'image') || imageError ? (
            <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">
              {result.title}
            </h3>
          ) : null}

          {/* Description */}
          {result.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
              {result.description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {result.meta_url?.favicon && (
                <img
                  src={result.meta_url.favicon}
                  alt=""
                  className="size-4 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground truncate flex-1">
                {result.meta_url?.hostname || new URL(result.url).hostname}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchResults({ data }: SearchResultsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (data.error) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <Search size={16} />
          <span className="font-medium">Search Error</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
          {data.error}
        </p>
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
          {`No search results found for ${data.query}`}
        </p>
      </div>
    );
  }

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
                {`Found ${data.total_results || data.results.length} results for ${data.query}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs px-2 py-1 flex items-center gap-1"
          >
            <Globe size={10} />
            {data.source === 'brave' ? 'Brave Search' : 'Search'}
          </Badge>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white dark:bg-gray-900 shadow-lg border-2"
            onClick={scrollLeft}
          >
            <ChevronLeft size={16} />
          </Button>
        )}

        {canScrollRight && (
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full bg-white dark:bg-gray-900 shadow-lg border-2"
            onClick={scrollRight}
          >
            <ChevronRight size={16} />
          </Button>
        )}

        {/* Carousel */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleScroll}
        >
          {data.results.map((result, index) => (
            <SearchResultCarouselCard
              key={`${result.url}-${index}`}
              result={result}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-muted-foreground text-center">
          Search completed at {new Date(data.timestamp).toLocaleTimeString()} •
          Scroll to explore {data.results.length} results
        </p>
      </div>
    </div>
  );
}
