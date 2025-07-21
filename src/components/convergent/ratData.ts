// RAT word sets from Bowden and Jung-Beeman (2003)
export const RAT_WORD_SETS = [
  { words: ["cottage", "swiss", "cake"], answer: "cheese" },
  { words: ["cream", "skate", "water"], answer: "ice" },
  { words: ["lounge", "beetle", "piano"], answer: "bar" },
  { words: ["mountain", "around", "beetle"], answer: "dung" },
  { words: ["nose", "french", "bass"], answer: "horn" },
  { words: ["ship", "outer", "crawl"], answer: "space" },
  { words: ["apple", "family", "house"], answer: "tree" },
  { words: ["river", "note", "account"], answer: "bank" },
  { words: ["print", "berry", "bird"], answer: "blue" },
  { words: ["mower", "atomic", "foreign"], answer: "power" },
  { words: ["sleeping", "bean", "trash"], answer: "bag" },
  { words: ["french", "car", "shoe"], answer: "horn" },
  { words: ["motion", "poke", "down"], answer: "slow" },
  { words: ["jump", "kill", "bliss"], answer: "joy" },
  { words: ["elephant", "lapse", "vivid"], answer: "memory" },
];

export type RATWordSet = typeof RAT_WORD_SETS[0];

export type RATProgress = {
  round1Complete: boolean;
  round2Complete: boolean;
};
