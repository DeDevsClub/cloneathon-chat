'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface ChatUsageData {
  count: number;
  maxCount: number;
  remaining: number;
  percentage: number;
}

export function ChatUsageIndicator() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<ChatUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/chats/count');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch chat usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [session]);

  if (loading || !session?.user || !usage) {
    return null;
  }

  const isNearLimit = usage.percentage >= 80;
  const isAtLimit = usage.percentage >= 100;

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare size={14} />
          <span>Chat Usage</span>
          {isNearLimit && (
            <AlertTriangle 
              size={14} 
              className={cn(
                "ml-auto",
                isAtLimit ? "text-red-500" : "text-yellow-500"
              )} 
            />
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {usage.count} of {usage.maxCount} chats
          </span>
          <span className={cn(
            "font-medium",
            isAtLimit ? "text-red-500" : 
            isNearLimit ? "text-yellow-500" : 
            "text-muted-foreground"
          )}>
            {usage.percentage}%
          </span>
        </div>
        
        <Progress 
          value={usage.percentage} 
          className={cn(
            "h-2",
            isAtLimit ? "[&>div]:bg-red-500" :
            isNearLimit ? "[&>div]:bg-yellow-500" :
            "[&>div]:bg-blue-500"
          )}
        />
        
        {isNearLimit && (
          <p className={cn(
            "text-xs",
            isAtLimit ? "text-red-500" : "text-yellow-600"
          )}>
            {isAtLimit 
              ? "You've reached your chat limit. Delete some chats to create new ones."
              : `Only ${usage.remaining} chats remaining.`
            }
          </p>
        )}
      </div>
    </div>
  );
}
