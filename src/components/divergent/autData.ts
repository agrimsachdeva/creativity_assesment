// AUT (Alternate Uses Test) Data
// Complete set of common everyday objects for creativity testing
// Based on standard AUT research instruments

export interface AUTItem {
  id: number;
  name: string;
  description: string;
  emoji: string;
  category: string;
}

export const AUT_ITEMS: AUTItem[] = [
  // Classic AUT Items (Most commonly used in research)
  {
    id: 1,
    name: "Brick",
    description: "A rectangular block typically used in construction",
    emoji: "🧱",
    category: "construction"
  },
  {
    id: 2,
    name: "Newspaper",
    description: "A printed publication containing news and information",
    emoji: "📰",
    category: "media"
  },
  {
    id: 3,
    name: "Paperclip",
    description: "A small metal or plastic clip used to hold papers together",
    emoji: "📎",
    category: "office"
  },
  {
    id: 4,
    name: "Shoe",
    description: "Footwear that covers and protects the foot",
    emoji: "👟",
    category: "clothing"
  },
  {
    id: 5,
    name: "Tin Can",
    description: "A cylindrical metal container typically used for food storage",
    emoji: "🥫",
    category: "container"
  },

  // Additional Standard Items
  {
    id: 6,
    name: "Tire",
    description: "A rubber wheel covering typically used on vehicles",
    emoji: "🛞",
    category: "automotive"
  },
  {
    id: 7,
    name: "Cardboard Box",
    description: "A container made from corrugated cardboard",
    emoji: "📦",
    category: "container"
  },
  {
    id: 8,
    name: "Coat Hanger",
    description: "A device used to hang up coats, jackets, or other garments",
    emoji: "🪝",
    category: "household"
  },
  {
    id: 9,
    name: "Fork",
    description: "A utensil with prongs used for eating",
    emoji: "🍴",
    category: "utensil"
  },
  {
    id: 10,
    name: "Button",
    description: "A small disc or knob sewn onto clothing as a fastener",
    emoji: "🔘",
    category: "clothing"
  },

  // Extended Research Set
  {
    id: 11,
    name: "Rubber Band",
    description: "An elastic loop typically made from rubber",
    emoji: "🔗",
    category: "office"
  },
  {
    id: 12,
    name: "Pencil",
    description: "A writing instrument with a graphite core",
    emoji: "✏️",
    category: "office"
  },
  {
    id: 13,
    name: "Spoon",
    description: "A utensil with a small shallow bowl for eating or serving",
    emoji: "🥄",
    category: "utensil"
  },
  {
    id: 14,
    name: "Bottle",
    description: "A container typically made of glass or plastic",
    emoji: "🍼",
    category: "container"
  },
  {
    id: 15,
    name: "String",
    description: "A thin cord or rope made of twisted fibers",
    emoji: "🧵",
    category: "craft"
  },

  // Contemporary Items
  {
    id: 16,
    name: "Coffee Cup",
    description: "A small container for drinking hot beverages",
    emoji: "☕",
    category: "kitchen"
  },
  {
    id: 17,
    name: "Towel",
    description: "An absorbent cloth used for drying",
    emoji: "🏖️",
    category: "household"
  },
  {
    id: 18,
    name: "Bucket",
    description: "A cylindrical container with a handle, used for carrying liquids",
    emoji: "🪣",
    category: "container"
  },
  {
    id: 19,
    name: "Tennis Ball",
    description: "A small fuzzy ball used in the sport of tennis",
    emoji: "🎾",
    category: "sports"
  },
  {
    id: 20,
    name: "Clock",
    description: "A device used to measure and display time",
    emoji: "🕐",
    category: "household"
  },

  // Additional Varied Items
  {
    id: 21,
    name: "Hammer",
    description: "A tool with a heavy head used for hitting things",
    emoji: "🔨",
    category: "tool"
  },
  {
    id: 22,
    name: "Mirror",
    description: "A reflective surface that shows an image",
    emoji: "🪞",
    category: "household"
  },
  {
    id: 23,
    name: "Toothbrush",
    description: "A small brush for cleaning teeth",
    emoji: "🪥",
    category: "personal care"
  },
  {
    id: 24,
    name: "Ladder",
    description: "A structure with rungs used for climbing up or down",
    emoji: "🪜",
    category: "tool"
  },
  {
    id: 25,
    name: "Balloon",
    description: "An inflatable rubber sac often used for decoration",
    emoji: "🎈",
    category: "recreation"
  }
];

// Helper functions for working with AUT items
export function getRandomAUTItem(): AUTItem {
  const randomIndex = Math.floor(Math.random() * AUT_ITEMS.length);
  return AUT_ITEMS[randomIndex];
}

export function getAUTItemsByCategory(category: string): AUTItem[] {
  return AUT_ITEMS.filter(item => item.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(AUT_ITEMS.map(item => item.category))];
}

export function getClassicAUTItems(): AUTItem[] {
  // Returns the most commonly used items in AUT research
  return AUT_ITEMS.filter(item => [1, 2, 3, 4, 5].includes(item.id));
}
