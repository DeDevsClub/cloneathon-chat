import { Image as ImageIcon, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ImageGenerationProps {
  result?: {
    success: boolean;
    imageUrl?: string;
    prompt?: string;
    size?: string;
    quality?: string;
    message?: string;
    error?: string;
  };
  args?: {
    prompt: string;
    size?: string;
    quality?: string;
  };
}

export function ImageGeneration({ result, args }: ImageGenerationProps) {
  // If no result, show loading state
  if (!result) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <ImageIcon size={16} className="animate-pulse" />
          <span className="font-medium">Generating image...</span>
        </div>
        {args && (
          <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
            Prompt: {args.prompt}
          </p>
        )}
      </div>
    );
  }

  // If error, show error state
  if (!result.success || result.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <ImageIcon size={16} />
          <span className="font-medium">Image generation failed</span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {result.error || 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  // Success state - show the generated image
  return (
    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-3">
        <ImageIcon size={16} />
        <span className="font-medium">Generated Image</span>
      </div>
      
      {result.prompt && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          <strong>Prompt:</strong> {result.prompt}
        </p>
      )}
      
      {result.imageUrl && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={result.imageUrl}
              alt={result.prompt || 'Generated image'}
              width={512}
              height={512}
              className="w-full h-auto max-w-lg mx-auto block"
              style={{ maxHeight: '512px', objectFit: 'contain' }}
              unoptimized // Since this is an external AI-generated image
            />
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = result.imageUrl!;
                link.download = `generated-image-${Date.now()}.png`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1"
            >
              <Download size={14} />
              Download
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(result.imageUrl, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink size={14} />
              Open in new tab
            </Button>
          </div>
          
          {(result.size || result.quality) && (
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 justify-center">
              {result.size && <span>Size: {result.size}</span>}
              {result.quality && <span>Quality: {result.quality}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
