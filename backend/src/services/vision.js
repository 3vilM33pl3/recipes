import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import config from '../config.js';

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

const RECIPE_PROMPT = `Extract the recipe and return it as JSON with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description if present",
  "servings": "e.g. 2",
  "prepTime": "e.g. 20 mins",
  "cookTime": "e.g. 35 mins",
  "difficulty": "e.g. Easy",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "nutrition": "nutrition info if present",
  "notes": "any additional notes"
}
Return ONLY valid JSON, no markdown or extra text.`;

export async function extractRecipe(imagePath) {
  try {
    const client = getClient();

    // Read image and convert to base64
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the recipe from this image and ${RECIPE_PROMPT}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const recipe = JSON.parse(jsonMatch[0]);

    return {
      recipe,
      rawText: content,
      success: true,
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return {
      recipe: null,
      rawText: '',
      success: false,
      error: error.message,
    };
  }
}

export async function extractRecipeFromText(text) {
  try {
    const client = getClient();

    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'user',
          content: `Here is recipe text from a document:\n\n${text}\n\n${RECIPE_PROMPT}`
        }
      ],
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const recipe = JSON.parse(jsonMatch[0]);

    return {
      recipe,
      rawText: content,
      success: true,
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return {
      recipe: null,
      rawText: '',
      success: false,
      error: error.message,
    };
  }
}
