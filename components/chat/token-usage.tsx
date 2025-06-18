'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TokenUsageProps {
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  className?: string;
}

export function TokenUsage({ usage, className }: TokenUsageProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const totalTokens = usage.totalTokens || (usage.promptTokens + usage.completionTokens);

  return (
    <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Info size={12} />
            <span className="font-mono">{totalTokens}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-1">
            <div className="font-medium text-sm">Token Usage</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span>Prompt:</span>
                <span className="font-mono">{usage.promptTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Completion:</span>
                <span className="font-mono">{usage.completionTokens.toLocaleString()}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between gap-4 font-medium">
                <span>Total:</span>
                <span className="font-mono">{totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
