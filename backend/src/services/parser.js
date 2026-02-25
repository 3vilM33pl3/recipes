// Recipe text parser - extracts title, ingredients, and instructions from OCR text

const INGREDIENT_KEYWORDS = [
  'ingredients', 'ingredient', 'bestanddele', 'what you need', 'you will need',
  'shopping list', 'items needed'
];

const INSTRUCTION_KEYWORDS = [
  'instructions', 'directions', 'method', 'steps', 'how to', 'preparation',
  'metode', 'bereiding', 'procedure', 'cooking steps'
];

export function parseRecipeText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      title: 'Untitled Recipe',
      description: null,
      ingredients: [],
      instructions: [],
    };
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) {
    return {
      title: 'Untitled Recipe',
      description: null,
      ingredients: [],
      instructions: [],
    };
  }

  // Extract title (first line or first substantial line)
  const title = extractTitle(lines);

  // Find sections
  const ingredientsStart = findSectionStart(lines, INGREDIENT_KEYWORDS);
  const instructionsStart = findSectionStart(lines, INSTRUCTION_KEYWORDS);

  let ingredients = [];
  let instructions = [];

  if (ingredientsStart !== -1 && instructionsStart !== -1) {
    // Both sections found
    if (ingredientsStart < instructionsStart) {
      ingredients = extractListItems(lines.slice(ingredientsStart + 1, instructionsStart));
      instructions = extractListItems(lines.slice(instructionsStart + 1));
    } else {
      instructions = extractListItems(lines.slice(instructionsStart + 1, ingredientsStart));
      ingredients = extractListItems(lines.slice(ingredientsStart + 1));
    }
  } else if (ingredientsStart !== -1) {
    // Only ingredients section found
    ingredients = extractListItems(lines.slice(ingredientsStart + 1));
  } else if (instructionsStart !== -1) {
    // Only instructions section found
    instructions = extractListItems(lines.slice(instructionsStart + 1));
  } else {
    // No clear sections - try to split intelligently
    const result = splitByContent(lines.slice(1)); // Skip title
    ingredients = result.ingredients;
    instructions = result.instructions;
  }

  return {
    title,
    description: null,
    ingredients: cleanList(ingredients),
    instructions: cleanList(instructions),
  };
}

function extractTitle(lines) {
  // Patterns that indicate NON-title lines (nutrition info, metadata, etc.)
  const skipPatterns = [
    /^\d+g[-\s]/i,                           // "5g-", "100g "
    /\d+\s*(kcal|cal|kj)/i,                  // calories
    /\b(carbs?|protein|fat|fibre|fiber|sugar|salt|saturates?)\b/i,  // nutrition
    /^per\s+serving/i,                       // "per serving"
    /^\d+\s*(mins?|hours?|hr)/i,             // "20 mins"
    /^(serves?|serving|prep|cook)\s*\d/i,   // "serves 4", "prep 20"
    /^(easy|medium|hard|difficult)$/i,       // difficulty levels
    /^[\d\-\•\*]+$/,                          // just numbers/bullets
    /^(gf|vg|v|df)$/i,                        // dietary labels
  ];

  // Patterns that indicate a GOOD title line
  const titlePatterns = [
    /^[A-Z][a-z]+(\s+[&a-zA-Z]+)+$/,         // "Curried chicken & baked dhal"
    /^[A-Z][a-z]+\s+[a-z]+/,                  // Capitalized phrase
  ];

  let candidateTitle = null;
  let candidateIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip section headers
    if (INGREDIENT_KEYWORDS.some(k => lower.includes(k)) ||
        INSTRUCTION_KEYWORDS.some(k => lower.includes(k))) {
      continue;
    }

    // Skip lines matching skip patterns
    if (skipPatterns.some(p => p.test(line))) {
      continue;
    }

    // Skip very short or very long lines
    if (line.length < 3 || line.length > 80) {
      continue;
    }

    // Check if this looks like a title
    const looksLikeTitle = titlePatterns.some(p => p.test(line)) ||
                           (/^[A-Z]/.test(line) && !/\d/.test(line.slice(0, 3)));

    if (looksLikeTitle) {
      // Check if next line continues the title (e.g., "& baked dhal")
      const nextLine = lines[i + 1];
      if (nextLine && /^[&+]/.test(nextLine) && nextLine.length < 40) {
        return `${line} ${nextLine}`;
      }
      return line;
    }

    // Keep first reasonable candidate as fallback
    if (candidateTitle === null && line.length >= 5) {
      candidateTitle = line;
      candidateIndex = i;
    }
  }

  return candidateTitle || lines[0] || 'Untitled Recipe';
}

function findSectionStart(lines, keywords) {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (keywords.some(k => lower.includes(k))) {
      return i;
    }
  }
  return -1;
}

function extractListItems(lines) {
  const items = [];
  let currentItem = '';

  for (const line of lines) {
    // Check if this starts a new list item
    const isListItem = /^[\d\-\*\u2022\u2023\u25E6\u2043•]/.test(line) ||
                       /^\d+[\.\)]\s/.test(line);

    if (isListItem) {
      if (currentItem) {
        items.push(currentItem);
      }
      // Remove list markers
      currentItem = line.replace(/^[\d\-\*\u2022\u2023\u25E6\u2043•\.\)]+\s*/, '').trim();
    } else if (currentItem) {
      // Continuation of previous item
      currentItem += ' ' + line;
    } else {
      // No list marker, treat as item
      items.push(line);
    }
  }

  if (currentItem) {
    items.push(currentItem);
  }

  return items;
}

function splitByContent(lines) {
  // Try to intelligently split content
  // Ingredients usually have quantities, instructions usually have verbs/steps

  const ingredients = [];
  const instructions = [];

  const quantityPattern = /\d+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|piece|slice|clove|can|bunch|pinch|dash)/i;
  const actionPattern = /^(mix|stir|add|combine|heat|cook|bake|fry|boil|simmer|chop|dice|slice|serve|pour|place|preheat|let|allow|remove|set)/i;

  for (const line of lines) {
    if (quantityPattern.test(line)) {
      ingredients.push(line);
    } else if (actionPattern.test(line) || /^\d+[\.\)]/.test(line)) {
      instructions.push(line);
    } else if (line.length < 50 && !line.includes('.')) {
      // Short lines without periods are likely ingredients
      ingredients.push(line);
    } else {
      // Longer lines are likely instructions
      instructions.push(line);
    }
  }

  return { ingredients, instructions };
}

function cleanList(items) {
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length < 500);
}
