import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

/**
 * Enhances a coding prompt to make it more effective for code generation
 *
 * @param originalPrompt The user's original prompt
 * @returns Enhanced prompt optimized for code generation
 */
export async function enhancePrompt(originalPrompt: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a prompt engineering expert specializing in coding prompts.
Your task is to enhance user prompts to make them more effective for code generation.
Follow these guidelines:
1. Add structure with clear sections (requirements, functionality, UI, etc.)
2. Improve specificity by adding technical details and constraints
3. Clarify ambiguous requirements
4. Add context for better code organization
5. Specify expected outputs and edge cases
6. Maintain the original intent of the prompt
7. Focus on making the prompt actionable for code generation
8. Do not add unnecessary verbosity`,
      prompt: `Enhance this coding prompt to make it more effective for generating high-quality code:
      
"${originalPrompt}"

Return only the enhanced prompt without explanations or additional text.`,
    })

    return text.trim()
  } catch (error) {
    console.error("Error enhancing prompt:", error)
    throw new Error("Failed to enhance prompt")
  }
}

