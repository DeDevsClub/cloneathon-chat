import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import { artifactModel, reasoningModel } from './models.test';

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
        'chat-model-reasoning': wrapLanguageModel({
          model: openai.chat('o3-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai.chat('gpt-4o'),
        'artifact-model': openai.chat('gpt-4o'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
      },
    });
