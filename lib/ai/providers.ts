import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import { artifactModel, reasoningModel } from './models.test';
import { selectAppropriateModel } from './modelSelection';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': openai.chat('gpt-4o'),
        'chat-model-reasoning': reasoningModel,
        'title-model': openai.chat('gpt-4o'),
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai.chat('gpt-4o'),
        'chat-model-reasoning': openai.chat('gpt-4o'),
        'title-model': openai.chat('gpt-4o'),
        'artifact-model': openai.chat('gpt-4o'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });

/**
 * Get the appropriate AI model based on content or force a specific model
 * @param content - The content to analyze for model selection
 * @param forceArtifactModel - If true, always use the artifact model regardless of content
 * @returns The selected language model
 */
export function getAppropriateModel(
  content: string,
  forceArtifactModel = false,
) {
  const modelType = forceArtifactModel
    ? 'artifact-model'
    : selectAppropriateModel(content);
  return myProvider.languageModel(modelType);
}
