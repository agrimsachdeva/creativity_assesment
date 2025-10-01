// Divergent Association Task (DAT) Data
// The DAT measures creativity by asking participants to generate 10 words 
// that are as semantically distant from each other as possible

export interface DATItem {
  id: string;
  instructions: string;
  rules: string[];
  examples?: {
    good: string[];
    bad: string[];
    explanation: string;
  };
}

export const DAT_TASK: DATItem = {
  id: "dat-semantic-distance",
  instructions: "Please enter 10 words that are as different from each other as possible, in all meanings and uses of the words.",
  rules: [
    "Only single words in English",
    "Only nouns (e.g., things, objects, concepts)",
    "No proper nouns (e.g., no specific people or places)", 
    "No specialised vocabulary (e.g., no technical terms)",
    "Think of the words on your own (e.g., do not just look at objects in your surroundings)"
  ],
  examples: {
    good: ["mountain", "happiness", "bicycle", "thunder", "democracy", "sandwich", "galaxy", "friendship", "hammer", "melody"],
    bad: ["car", "truck", "vehicle", "automobile"], // Too similar semantically
    explanation: "Good examples cover different semantic categories (nature, emotions, objects, concepts, etc.) while bad examples are all related to transportation."
  }
};

// Helper function to validate DAT words
export function validateDATWord(word: string): { valid: boolean; error?: string } {
  const trimmedWord = word.trim().toLowerCase();
  
  if (!trimmedWord) {
    return { valid: false, error: "Word cannot be empty" };
  }
  
  if (trimmedWord.includes(' ')) {
    return { valid: false, error: "Only single words allowed" };
  }
  
  if (trimmedWord.length < 2) {
    return { valid: false, error: "Word must be at least 2 characters long" };
  }
  
  if (!/^[a-z]+$/.test(trimmedWord)) {
    return { valid: false, error: "Only English letters allowed" };
  }
  
  return { valid: true };
}

// Helper function to check for potential duplicates or very similar words
export function checkWordSimilarity(words: string[]): string[] {
  const warnings: string[] = [];
  const lowercaseWords = words.map(w => w.toLowerCase());
  
  // Check for exact duplicates
  const duplicates = lowercaseWords.filter((word, index) => 
    lowercaseWords.indexOf(word) !== index
  );
  
  if (duplicates.length > 0) {
    warnings.push(`Duplicate words found: ${duplicates.join(', ')}`);
  }
  
  // Check for very similar words (basic similarity check)
  const similarPairs: string[] = [];
  for (let i = 0; i < lowercaseWords.length; i++) {
    for (let j = i + 1; j < lowercaseWords.length; j++) {
      const word1 = lowercaseWords[i];
      const word2 = lowercaseWords[j];
      
      // Check if words are very similar (share common root or are variants)
      if (word1.includes(word2) || word2.includes(word1)) {
        similarPairs.push(`${word1} / ${word2}`);
      }
    }
  }
  
  if (similarPairs.length > 0) {
    warnings.push(`Potentially similar words: ${similarPairs.join(', ')}`);
  }
  
  return warnings;
}
