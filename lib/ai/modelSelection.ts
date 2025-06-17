/**
 * Utility to select the appropriate AI model based on content analysis
 * Ensures artifact model is used for specific content types like code and structured writing
 */
export function selectAppropriateModel(content: string): string {
  // Check if content contains Python code
  if (
    content.includes('```python') ||
    content.includes('```py') ||
    /^import\s+|^from\s+\w+\s+import/.test(content)
  ) {
    return 'artifact-model';
  }
  
  // Check if content is likely an essay (long text with paragraphs)
  if (content.length > 1000 && content.split('\n\n').length > 3) {
    return 'artifact-model';
  }

  // Check for other programming languages that should use artifact model
  if (content.match(/```(?:javascript|typescript|java|cpp|c\+\+|c#|ruby|go|rust|php|html|css|json)/)) {
    return 'artifact-model';
  }
  
  // If the content explicitly mentions code examples or tutorials
  if (
    content.toLowerCase().includes('code example') ||
    content.toLowerCase().includes('tutorial') ||
    (content.toLowerCase().includes('function') && content.includes('(') && content.includes(')'))
  ) {
    return 'artifact-model';
  }

  // Check if it looks like an essay or formal writing
  if (
    (content.toLowerCase().includes('essay') ||
    content.toLowerCase().includes('article') ||
    content.toLowerCase().includes('paper')) &&
    content.length > 500
  ) {
    return 'artifact-model';
  }
  
  // Default to reasoning model for other content types
  return 'reasoning-model'; 
}
