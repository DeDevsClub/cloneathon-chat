import { z } from 'zod';
import { Session } from 'next-auth';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import { Suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { getAppropriateModel } from '../providers';

interface RequestSuggestionsProps {
  session: Session;
  dataStream: DataStreamWriter;
  forceArtifactModel?: boolean; // Optional parameter to force artifact model usage
}

export const requestSuggestions = ({
  session,
  dataStream,
  forceArtifactModel = false,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      documentId: z
        .string()
        .describe('The ID of the document to request edits'),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: 'Document not found',
        };
      }

      const suggestions: Array<
        Omit<Suggestion, 'userId' | 'createdAt' | 'updatedAt'>
      > = [];

      // Choose the appropriate model based on content type
      // Uses the forceArtifactModel parameter passed to the tool function
      const documentContent = document.content || '';
      const selectedModel = getAppropriateModel(
        documentContent,
        forceArtifactModel,
      );

      const { elementStream } = streamObject({
        model: selectedModel,
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content,
        output: 'array',
        schema: z.object({
          originalSentence: z.string().describe('The original sentence'),
          suggestedSentence: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
        }),
      });

      for await (const element of elementStream) {
        const suggestion = {
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          id: generateUUID(),
          documentId: documentId,
          isResolved: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: session.user?.id,
        };

        dataStream.writeData({
          type: 'suggestion',
          content: JSON.stringify(suggestion),
          metadata: {
            createdAt: suggestion.createdAt.toISOString(),
            updatedAt: suggestion.updatedAt.toISOString(),
          },
        });

        suggestions.push(suggestion);
      }

      if (session.user?.id) {
        const userId = session.user.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      };
    },
  });
