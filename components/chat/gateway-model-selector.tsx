'use client';

import { useAvailableModels } from '@/hooks/use-available-models';
import { Loader2 } from 'lucide-react';
import { DEFAULT_MODEL } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { DisplayModel } from '@/lib/ai/models/displayModel';
import { memo } from 'react';

type GatewayModelSelectorProps = {
  modelId: string;
  onModelChange: (modelId: string) => void;
};

export const GatewayModelSelector = memo(function GatewayModelSelector({
  modelId = DEFAULT_MODEL,
  onModelChange,
}: GatewayModelSelectorProps) {
  const { models, isLoading, error } = useAvailableModels();

  return (
    <Select
      value={modelId}
      onValueChange={onModelChange}
      disabled={isLoading || !!error || !models?.length}
    >
      <SelectTrigger className="w-[180px]">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading</span>
          </div>
        ) : error ? (
          <span className="text-red-500">Error</span>
        ) : !models?.length ? (
          <span>No models</span>
        ) : (
          <SelectValue placeholder="Select a model" />
        )}
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>Models</SelectLabel>
          {models?.map((model: DisplayModel) => (
            <SelectItem key={model.id} value={model.id}>
              {model.label}
            </SelectItem>
          )) || []}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});
