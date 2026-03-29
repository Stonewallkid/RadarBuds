// Cannabis effect dimensions for radar chart
// 13 dimensions ordered by category: effects -> medical -> sensory
export const EFFECT_DIMENSIONS = [
  'Potency',        // 0 - top (12 o'clock) - overall strength
  'Euphoria',       // 1 - upper right
  'Creativity',     // 2 - right upper
  'Focus',          // 3 - right (3 o'clock)
  'Energy',         // 4 - lower right
  'Relaxation',     // 5 - lower right
  'Sleep Aid',      // 6 - bottom (6 o'clock)
  'Pain Relief',    // 7 - lower left
  'Anxiety Relief', // 8 - lower left
  'Munchies',       // 9 - left (9 o'clock)
  'Smoothness',     // 10 - upper left
  'Aroma',          // 11 - upper left
  'Flavor',         // 12 - back to top left
] as const;

export type EffectDimension = typeof EFFECT_DIMENSIONS[number];

// Rating values for each dimension (0-10)
export type EffectRatings = Record<EffectDimension, number>;

// Create empty ratings (all zeros)
export function createEmptyRatings(): EffectRatings {
  return EFFECT_DIMENSIONS.reduce((acc, dim) => {
    acc[dim] = 0;
    return acc;
  }, {} as EffectRatings);
}

// Strain type options (Indica-Sativa spectrum)
export const STRAIN_TYPES = [
  'Indica',
  'Indica-Dominant',
  'Balanced Hybrid',
  'Sativa-Dominant',
  'Sativa',
] as const;

export type StrainType = typeof STRAIN_TYPES[number];

// Bud appearance options
export const BUD_APPEARANCES = [
  'Light Green',
  'Forest Green',
  'Purple',
  'Orange-Tinged',
  'Frosty',
  'Dark',
] as const;

export type BudAppearance = typeof BUD_APPEARANCES[number];

// Strain information
export interface StrainInfo {
  name: string;
  genetics: string;
  strainType: StrainType;
  thcPercent?: number;
  cbdPercent?: number;
  grower?: string;
  imageUrl?: string;
}

// Full strain rating
export interface StrainRating {
  strain: StrainInfo;
  strainType: StrainType;
  budAppearance?: BudAppearance;
  effectRatings: EffectRatings;
  overallRating: number; // 1-10
}

// Question prompts for each dimension with detailed explanations
export const DIMENSION_QUESTIONS: Record<EffectDimension, {
  question: string;
  lowLabel: string;
  highLabel: string;
  explanation: string;
}> = {
  Potency: {
    question: "How potent are the effects?",
    lowLabel: "Mild, subtle",
    highLabel: "Very strong",
    explanation: "Potency measures the overall intensity of the effects. A high potency strain hits hard and fast with pronounced effects. Low potency strains offer gentler, more manageable experiences ideal for beginners or microdosing."
  },
  Euphoria: {
    question: "How euphoric does it make you feel?",
    lowLabel: "Neutral mood",
    highLabel: "Intense happiness",
    explanation: "Euphoria is that uplifted, happy feeling. High euphoria strains make you feel joyful, giggly, and positive. Some strains are more functional without the strong mood lift, which can be preferable for certain activities."
  },
  Creativity: {
    question: "Does it boost creativity?",
    lowLabel: "No creative boost",
    highLabel: "Highly creative",
    explanation: "Some strains unlock creative thinking, making art, music, writing, or brainstorming more enjoyable. High creativity strains often bring new perspectives and ideas. Others keep you grounded in practical, linear thinking."
  },
  Focus: {
    question: "How focused can you stay?",
    lowLabel: "Scattered, distracted",
    highLabel: "Laser focused",
    explanation: "Focus measures your ability to concentrate on tasks. Some strains sharpen attention and help you lock into work or activities. Others may make your mind wander or feel foggy, which might be desirable for relaxation."
  },
  Energy: {
    question: "How energizing is it?",
    lowLabel: "Sedating, couch-lock",
    highLabel: "Very energizing",
    explanation: "Energy refers to physical and mental stimulation. High energy strains are great for activities, socializing, or getting things done. Low energy strains lead to that classic 'couch-lock' feeling perfect for unwinding."
  },
  Relaxation: {
    question: "How relaxing is the body high?",
    lowLabel: "Not relaxing",
    highLabel: "Deeply relaxing",
    explanation: "Relaxation measures the calming effect on your body and mind. High relaxation strains melt away tension and stress, often with a pleasant body buzz. Some strains keep you alert without much physical relaxation."
  },
  'Sleep Aid': {
    question: "Does it help with sleep?",
    lowLabel: "Keeps you awake",
    highLabel: "Strong sleep aid",
    explanation: "Some strains are excellent for bedtime, helping you fall asleep faster and sleep more soundly. High sleep aid strains are typically heavy indicas. Others are better for daytime use and won't make you drowsy."
  },
  'Pain Relief': {
    question: "How effective for pain relief?",
    lowLabel: "No pain relief",
    highLabel: "Strong pain relief",
    explanation: "Many people use cannabis for pain management. High pain relief strains can help with chronic pain, headaches, muscle soreness, and inflammation. The effect varies by person and type of pain."
  },
  'Anxiety Relief': {
    question: "Does it reduce anxiety?",
    lowLabel: "May increase anxiety",
    highLabel: "Very calming",
    explanation: "Anxiety relief measures how well a strain calms nervousness and racing thoughts. Some strains are excellent for anxiety, while others (especially high-THC sativas) may actually increase anxiety in some people."
  },
  Munchies: {
    question: "Does it give you the munchies?",
    lowLabel: "No appetite change",
    highLabel: "Intense hunger",
    explanation: "The 'munchies' is that increased appetite many experience. Some strains strongly stimulate hunger, which can be beneficial for medical patients or a fun experience with good food. Others have minimal appetite effects."
  },
  Smoothness: {
    question: "How smooth is the smoke/vapor?",
    lowLabel: "Harsh, cough-inducing",
    highLabel: "Very smooth",
    explanation: "Smoothness measures how easy the strain is on your throat and lungs. Smooth strains are pleasant to inhale with minimal coughing. Harsh strains may cause more irritation, especially for those with sensitive airways."
  },
  Aroma: {
    question: "How appealing is the aroma?",
    lowLabel: "Weak or unpleasant",
    highLabel: "Amazing smell",
    explanation: "Aroma is what you smell when you open the jar. Great strains often have complex, appealing scents - fruity, earthy, diesel, sweet, or skunky. The nose can hint at the flavor and sometimes the effects to expect."
  },
  Flavor: {
    question: "How flavorful is it?",
    lowLabel: "Bland, tasteless",
    highLabel: "Rich, complex flavor",
    explanation: "Flavor is the taste experience when consuming. Look for notes like citrus, berry, pine, diesel, cheese, chocolate, or earthy tones. Quality strains often have distinct, memorable flavors that linger pleasantly."
  },
};

// Strain type colors for UI (Indica = purple/indigo, Sativa = orange/yellow)
export const STRAIN_TYPE_COLORS: Record<StrainType, string> = {
  'Indica': '#6366f1',           // Indigo
  'Indica-Dominant': '#8b5cf6',  // Violet
  'Balanced Hybrid': '#22c55e',  // Green
  'Sativa-Dominant': '#eab308',  // Yellow
  'Sativa': '#f97316',           // Orange
};

// Bud appearance colors for UI
export const BUD_APPEARANCE_COLORS: Record<BudAppearance, string> = {
  'Light Green': '#86efac',    // Green-300
  'Forest Green': '#166534',   // Green-800
  'Purple': '#7c3aed',         // Violet-600
  'Orange-Tinged': '#fb923c',  // Orange-400
  'Frosty': '#f1f5f9',         // Slate-100
  'Dark': '#374151',           // Gray-700
};

// Popular genetics for autocomplete
export const POPULAR_GENETICS = [
  'Blue Dream',
  'OG Kush',
  'Girl Scout Cookies',
  'Sour Diesel',
  'Granddaddy Purple',
  'Jack Herer',
  'Northern Lights',
  'White Widow',
  'Gorilla Glue #4',
  'Wedding Cake',
  'Gelato',
  'Zkittlez',
  'Pineapple Express',
  'Purple Haze',
  'AK-47',
  'Durban Poison',
  'Trainwreck',
  'Bubba Kush',
  'Maui Wowie',
  'Green Crack',
  'Bruce Banner',
  'Strawberry Cough',
  'Cherry Pie',
  'Runtz',
  'Ice Cream Cake',
  'Do-Si-Dos',
  'Mac 1',
  'GMO Cookies',
  'Sundae Driver',
  'Mimosa',
] as const;
