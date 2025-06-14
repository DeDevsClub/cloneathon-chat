import { POST } from '../route'; // Adjust the path if your route file is named differently or located elsewhere
import { NextRequest } from 'next/server';
import httpMocks from 'node-mocks-http';
import OpenAI from 'openai'; // Import to allow Jest to mock it
import { SYSTEM_PROMPT, ORIGINAL_TEXT } from '@/lib/constants';
import { jest, it, describe, beforeEach, expect } from '@jest/globals';

// Mock the OpenAI SDK
// We hoist this mock to the top using jest.mock
const mockCreateCompletion = jest.fn();
jest.mock('openai', () => {
  // This mocks the OpenAI class constructor
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: mockCreateCompletion,
        },
      },
    };
  });
});

describe('/api/enhance POST', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockCreateCompletion.mockReset();
    // Clear the OpenAI constructor mock calls too, if needed for specific tests
    (OpenAI as unknown as jest.Mock).mockClear();
  });

  it('should return enhanced text for a valid request', async () => {
    const actualEnhancedText = 'This is the actual enhanced prompt text.';
    const mockAiJsonResponse = JSON.stringify({
      enhancedPrompt: actualEnhancedText,
      notes: ['Some note about the enhancement.'],
    });

    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockAiJsonResponse, // OpenAI returns a stringified JSON
          },
        },
      ],
    });

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      // Simulate NextRequest's json() method
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ enhancedText: actualEnhancedText }); // Expecting the extracted text
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(mockCreateCompletion).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: ORIGINAL_TEXT },
      ],
    });
  });

  it('should return 400 if text is missing', async () => {
    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () => Promise.resolve({ apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Text input is required' });
  });

  it('should return 400 if text is not a string', async () => {
    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () => Promise.resolve({ text: 123, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Text input must be a string' });
  });

  it('should return 400 if apiKey is missing', async () => {
    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () => Promise.resolve({ text: ORIGINAL_TEXT }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'OpenAI API key is required' });
  });

  it('should return 400 if apiKey is not a string', async () => {
    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () => Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 123 }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'OpenAI API key must be a string' });
  });

  it('should return 500 if OpenAI call fails generally', async () => {
    // Simulate a generic error from OpenAI client
    mockCreateCompletion.mockRejectedValueOnce(
      new Error('Network error or similar'),
    );

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred on the server.');
    expect(data.details).toBe('Network error or similar');
  });

  it('should return 500 if OpenAI returns no enhanced text', async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: { content: null }, // Simulate no content from AI
        },
      ],
    });

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to get content from OpenAI' }); // Updated error message
  });

  it('should handle malformed JSON in request (simulated by req.json() rejecting)', async () => {
    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      // Simulate req.json() throwing an error, as if body was malformed
      json: () =>
        Promise.reject(
          new SyntaxError('Unexpected token i in JSON at position 0'),
        ),
    });

    // Manually attach the reject to the json method of the req object for this test
    // because httpMocks.createRequest doesn't directly simulate NextRequest's internal error handling for json()
    // In a real NextRequest, if req.json() fails, it would lead to an error caught by the try-catch block.
    // Here, we're testing that our catch block correctly identifies SyntaxError.

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid JSON in request body' });
  });

  it('should handle OpenAI API specific error structure (e.g., status and error object)', async () => {
    const apiError = {
      status: 401,
      error: { message: 'Invalid API key from OpenAI' },
    };
    mockCreateCompletion.mockRejectedValueOnce(apiError);

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'invalid-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      error: 'OpenAI API error',
      details: 'Invalid API key from OpenAI',
    });
  });

  it('should handle OpenAI API error with response object (older SDK style)', async () => {
    const apiError = {
      response: {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      },
    };
    mockCreateCompletion.mockRejectedValueOnce(apiError);

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: 'Original text', apiKey: 'rate-limited-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({
      error: 'OpenAI API error',
      details: { error: { message: 'Rate limit exceeded' } },
    });
  });

  it('should return 500 if AI response is not valid JSON', async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'This is not JSON, but just a plain string.', // AI returns non-JSON
          },
        },
      ],
    });

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('OpenAI returned an unexpected response format.');
    expect(data.details).toBe("Expected JSON with 'enhancedPrompt' field.");
  });

  it("should return 500 if AI's JSON response is missing 'enhancedPrompt' field", async () => {
    const mockAiJsonResponseMissingField = JSON.stringify({
      // enhancedPrompt is missing
      notes: ['Some note about the enhancement.'],
    });

    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockAiJsonResponseMissingField,
          },
        },
      ],
    });

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "OpenAI response did not contain a valid 'enhancedPrompt' string field",
    );
  });

  it("should return 500 if AI's 'enhancedPrompt' field is not a string", async () => {
    const mockAiJsonResponseWrongType = JSON.stringify({
      enhancedPrompt: 12345, // Not a string
      notes: ['Some note about the enhancement.'],
    });

    mockCreateCompletion.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: mockAiJsonResponseWrongType,
          },
        },
      ],
    });

    const req = httpMocks.createRequest<NextRequest>({
      method: 'POST',
      url: '/api/enhance',
      json: () =>
        Promise.resolve({ text: ORIGINAL_TEXT, apiKey: 'test-api-key' }),
    });

    const response = await POST(req as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "OpenAI response did not contain a valid 'enhancedPrompt' string field",
    );
  });
});
