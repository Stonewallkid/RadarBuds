// Beverage-specific configuration for RadarBuds
// Cannabis strain rating app

export type BeverageType = 'cannabis';

export interface BeverageConfig {
  type: BeverageType;
  name: string;
  brandName: string;
  tagline: string;
  accentColor: string;
  accentColorHover: string;
  flavorDimensions: string[];
  dimensionQuestions: Record<string, { question: string; lowLabel: string; highLabel: string }>;
  typeOptions: { name: string; color: string }[];
  typeLabel: string;
  geneticsLabel: string;
}

// Cannabis configuration
const cannabisConfig: BeverageConfig = {
  type: 'cannabis',
  name: 'Strain',
  brandName: 'RadarBuds',
  tagline: 'Rate strains with an interactive effect radar map',
  accentColor: '#16a34a', // green-600
  accentColorHover: '#22c55e', // green-500
  flavorDimensions: [
    'Potency', 'Euphoria', 'Creativity', 'Focus', 'Energy',
    'Relaxation', 'Sleep Aid', 'Pain Relief', 'Anxiety Relief',
    'Munchies', 'Smoothness', 'Aroma', 'Flavor',
  ],
  dimensionQuestions: {
    'Potency': { question: 'How potent is this strain?', lowLabel: 'Mild', highLabel: 'Very strong' },
    'Euphoria': { question: 'How euphoric does it make you feel?', lowLabel: 'No euphoria', highLabel: 'Intensely euphoric' },
    'Creativity': { question: 'Does it enhance creativity?', lowLabel: 'Not creative', highLabel: 'Very creative' },
    'Focus': { question: 'How does it affect your focus?', lowLabel: 'Scattered', highLabel: 'Laser focused' },
    'Energy': { question: 'How energizing is it?', lowLabel: 'Sedating', highLabel: 'Very energizing' },
    'Relaxation': { question: 'How relaxing is it?', lowLabel: 'Not relaxing', highLabel: 'Deeply relaxing' },
    'Sleep Aid': { question: 'Does it help with sleep?', lowLabel: 'Keeps you awake', highLabel: 'Great for sleep' },
    'Pain Relief': { question: 'How effective for pain relief?', lowLabel: 'No relief', highLabel: 'Excellent relief' },
    'Anxiety Relief': { question: 'Does it help with anxiety?', lowLabel: 'Increases anxiety', highLabel: 'Very calming' },
    'Munchies': { question: 'How much does it increase appetite?', lowLabel: 'No appetite change', highLabel: 'Intense munchies' },
    'Smoothness': { question: 'How smooth is the smoke/vapor?', lowLabel: 'Harsh', highLabel: 'Very smooth' },
    'Aroma': { question: 'How pleasant is the aroma?', lowLabel: 'Unpleasant', highLabel: 'Amazing aroma' },
    'Flavor': { question: 'How does it taste?', lowLabel: 'Bland/harsh', highLabel: 'Delicious' },
  },
  typeOptions: [
    { name: 'Indica', color: '#7c3aed' },
    { name: 'Indica-Dominant', color: '#8b5cf6' },
    { name: 'Balanced Hybrid', color: '#16a34a' },
    { name: 'Sativa-Dominant', color: '#f97316' },
    { name: 'Sativa', color: '#ea580c' },
  ],
  typeLabel: 'Strain Type',
  geneticsLabel: 'Genetics',
};

// All configurations
const configs: Record<BeverageType, BeverageConfig> = {
  cannabis: cannabisConfig,
};

// Get current beverage type from environment
export function getBeverageType(): BeverageType {
  return 'cannabis';
}

// Get configuration for current beverage type
export function getBeverageConfig(): BeverageConfig {
  return configs[getBeverageType()];
}

// Export config for reference
export { cannabisConfig };
