import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import { isTestEnvironment } from '../constants';
import { artifactModel, reasoningModel } from './models.test';
import { selectAppropriateModel } from './modelSelection';
import { chatModels, modelIdMap } from './models';

// Create a mapping of models to their appropriate providers
const modelProviders = {
  openai,
  xai,
  groq,
};

// Function to get the correct provider instance for a model
function getModelProvider(modelId: string) {
  // Handle legacy model IDs
  const actualModelId = modelIdMap[modelId] || modelId;

  // Find the model configuration
  const modelConfig = chatModels.find((m) => m.id === actualModelId);
  if (!modelConfig) {
    console.warn(`Model ${actualModelId} not found, falling back to OpenAI`);
    return openai.chat('gpt-4o');
  }

  // Get the appropriate provider and create chat model
  switch (modelConfig.provider) {
    case 'openai':
      return openai.chat(modelConfig.model);
    case 'xai':
      return xai.chat(modelConfig.model);
    case 'groq':
      return groq.languageModel(modelConfig.model);
    default:
      console.warn(
        `Provider ${modelConfig.provider} not found, falling back to OpenAI`,
      );
      return openai.chat('gpt-4o');
  }
}

// Create language models mapping for all available models
const createLanguageModels = () => {
  const models: Record<string, any> = {};

  // Add all configured chat models
  chatModels.forEach((model) => {
    models[model.id] = getModelProvider(model.id);
  });

  // Add legacy model mappings
  Object.entries(modelIdMap).forEach(([legacyId, newId]) => {
    models[legacyId] = getModelProvider(newId);
  });

  return models;
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': openai.chat('gpt-4o'),
        'chat-model-reasoning': reasoningModel,
        'title-model': openai.chat('gpt-4o'),
        'artifact-model': artifactModel,
        ...createLanguageModels(),
      },
    })
  : customProvider({
      languageModels: createLanguageModels(),
      imageModels: {
        'small-model': openai.image('dall-e-3'),
        'dall-e-3': openai.image('dall-e-3'),
        'dall-e-2': openai.image('dall-e-2'),
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

/**
 * Get a specific model by ID
 * @param modelId - The model ID to retrieve
 * @returns The selected language model
 */
export function getModelById(modelId: string) {
  // Handle legacy model IDs
  const actualModelId = modelIdMap[modelId] || modelId;
  return myProvider.languageModel(actualModelId);
}
