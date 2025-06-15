'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningStepsProps {
  reasoning: string;
  className?: string;
}

export function ReasoningSteps({ reasoning, className }: ReasoningStepsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning || reasoning.trim().length === 0) {
    return null;
  }

  // Split reasoning into steps (assuming they're separated by newlines or paragraphs)
  const steps = reasoning
    .split(/\n\s*\n|\n(?=\d+\.|\-|\*)|(?<=\.)\s*(?=[A-Z])/g)
    .filter(step => step.trim().length > 0)
    .map(step => step.trim());

  return (
    <div className={cn("mb-4", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 h-auto"
      >
        {isExpanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <Brain className="size-4" />
        <span className="text-sm font-medium">
          {isExpanded ? 'Hide reasoning' : 'Show reasoning'}
        </span>
        <Sparkles className="size-3 text-violet-500" />
        <span className="text-xs text-muted-foreground">
          ({steps.length} step{steps.length !== 1 ? 's' : ''})
        </span>
      </Button>

      {isExpanded && (
        <div className="mt-2 ml-4 border-l-2 border-violet-200 dark:border-violet-800 pl-4 space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
