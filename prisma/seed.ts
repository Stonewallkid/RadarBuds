import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

// Map Cannlytics data to our 13 effect dimensions
interface StrainData {
  name: string;
  thc: number;
  effects: string[];
  aromas: string[];
  myrcene: number;
  limonene: number;
  pinene: number;
  linalool: number;
  caryophyllene: number;
}

// Our 13 dimensions
type EffectDimension =
  | 'Potency' | 'Euphoria' | 'Creativity' | 'Focus' | 'Energy'
  | 'Relaxation' | 'Sleep Aid' | 'Pain Relief' | 'Anxiety Relief'
  | 'Munchies' | 'Smoothness' | 'Aroma' | 'Flavor';

function hasEffect(effects: string[], ...keywords: string[]): boolean {
  return effects.some(e => keywords.some(k => e.toLowerCase().includes(k)));
}

function clamp(val: number, min: number = 0, max: number = 10): number {
  return Math.max(min, Math.min(max, val));
}

// Map strain data to our 13 effect ratings
function mapToEffectRatings(data: StrainData): Record<EffectDimension, number> {
  const { thc, effects, aromas, myrcene, limonene, pinene, linalool, caryophyllene } = data;

  // Potency: Scale THC% (0-30% -> 0-10)
  const potency = clamp(thc / 3, 0, 10);

  // Euphoria: effect_euphoric, effect_happy + limonene boost
  let euphoria = 3;
  if (hasEffect(effects, 'euphoric')) euphoria += 3;
  if (hasEffect(effects, 'happy')) euphoria += 2;
  if (hasEffect(effects, 'giggly')) euphoria += 1;
  euphoria += limonene * 3;
  euphoria = clamp(euphoria);

  // Creativity: effect_creative + pinene/limonene boost
  let creativity = 3;
  if (hasEffect(effects, 'creative')) creativity += 4;
  if (hasEffect(effects, 'uplifted')) creativity += 1;
  creativity += (pinene + limonene) * 2;
  creativity = clamp(creativity);

  // Focus: effect_focused + pinene boost
  let focus = 3;
  if (hasEffect(effects, 'focused')) focus += 4;
  if (hasEffect(effects, 'energetic')) focus += 1;
  focus += pinene * 5;
  focus = clamp(focus);

  // Energy: effect_energetic, effect_uplifted - indica terpenes
  let energy = 4;
  if (hasEffect(effects, 'energetic')) energy += 3;
  if (hasEffect(effects, 'uplifted')) energy += 2;
  if (hasEffect(effects, 'talkative')) energy += 1;
  energy += limonene * 3;
  energy -= myrcene * 2; // Myrcene is sedating
  if (hasEffect(effects, 'sleepy')) energy -= 3;
  energy = clamp(energy);

  // Relaxation: effect_relaxed + myrcene/linalool
  let relaxation = 4;
  if (hasEffect(effects, 'relaxed')) relaxation += 3;
  if (hasEffect(effects, 'tingly')) relaxation += 1;
  relaxation += myrcene * 4;
  relaxation += linalool * 3;
  relaxation = clamp(relaxation);

  // Sleep Aid: effect_sleepy + high myrcene
  let sleepAid = 2;
  if (hasEffect(effects, 'sleepy')) sleepAid += 5;
  if (hasEffect(effects, 'relaxed')) sleepAid += 1;
  sleepAid += myrcene * 4;
  if (hasEffect(effects, 'energetic')) sleepAid -= 2;
  sleepAid = clamp(sleepAid);

  // Pain Relief: caryophyllene + myrcene + relaxation
  let painRelief = 3;
  painRelief += caryophyllene * 6;
  painRelief += myrcene * 3;
  if (hasEffect(effects, 'relaxed')) painRelief += 1;
  painRelief = clamp(painRelief);

  // Anxiety Relief: linalool + low THC helps, paranoid hurts
  let anxietyRelief = 4;
  anxietyRelief += linalool * 6;
  if (hasEffect(effects, 'relaxed')) anxietyRelief += 2;
  if (hasEffect(effects, 'paranoid')) anxietyRelief -= 4;
  if (hasEffect(effects, 'dizzy')) anxietyRelief -= 1;
  if (thc > 25) anxietyRelief -= 2; // High THC can cause anxiety
  anxietyRelief = clamp(anxietyRelief);

  // Munchies: effect_hungry
  let munchies = 3;
  if (hasEffect(effects, 'hungry')) munchies += 5;
  munchies += myrcene * 2;
  munchies = clamp(munchies);

  // Smoothness: linalool helps, low harshness
  let smoothness = 5;
  smoothness += linalool * 4;
  smoothness += limonene * 2;
  if (hasEffect(effects, 'dry_mouth')) smoothness -= 1;
  smoothness = clamp(smoothness);

  // Aroma: based on aroma diversity and terpene content
  let aroma = 4;
  aroma += Math.min(aromas.length * 0.8, 4);
  aroma += (myrcene + limonene + pinene + linalool) * 1.5;
  aroma = clamp(aroma);

  // Flavor: terpene diversity
  let flavor = 4;
  const terpeneTotal = myrcene + limonene + pinene + linalool + caryophyllene;
  flavor += terpeneTotal * 2;
  flavor += Math.min(aromas.length * 0.5, 2);
  flavor = clamp(flavor);

  return {
    'Potency': Math.round(potency * 10) / 10,
    'Euphoria': Math.round(euphoria * 10) / 10,
    'Creativity': Math.round(creativity * 10) / 10,
    'Focus': Math.round(focus * 10) / 10,
    'Energy': Math.round(energy * 10) / 10,
    'Relaxation': Math.round(relaxation * 10) / 10,
    'Sleep Aid': Math.round(sleepAid * 10) / 10,
    'Pain Relief': Math.round(painRelief * 10) / 10,
    'Anxiety Relief': Math.round(anxietyRelief * 10) / 10,
    'Munchies': Math.round(munchies * 10) / 10,
    'Smoothness': Math.round(smoothness * 10) / 10,
    'Aroma': Math.round(aroma * 10) / 10,
    'Flavor': Math.round(flavor * 10) / 10,
  };
}

// Add random variation to create consensus effect
function addVariation(ratings: Record<string, number>, variance: number = 1.5): Record<string, number> {
  const varied: Record<string, number> = {};
  for (const [key, value] of Object.entries(ratings)) {
    const delta = (Math.random() - 0.5) * 2 * variance;
    varied[key] = clamp(Math.round((value + delta) * 10) / 10);
  }
  return varied;
}

// Infer strain type from effects and terpenes
function inferStrainType(data: StrainData): string {
  const { effects, myrcene, limonene, pinene } = data;

  let indicaScore = 0;
  let sativaScore = 0;

  // Effect-based scoring
  if (hasEffect(effects, 'relaxed')) indicaScore += 2;
  if (hasEffect(effects, 'sleepy')) indicaScore += 3;
  if (hasEffect(effects, 'hungry')) indicaScore += 1;

  if (hasEffect(effects, 'energetic')) sativaScore += 3;
  if (hasEffect(effects, 'creative')) sativaScore += 2;
  if (hasEffect(effects, 'focused')) sativaScore += 2;
  if (hasEffect(effects, 'uplifted')) sativaScore += 2;
  if (hasEffect(effects, 'talkative')) sativaScore += 1;

  // Terpene-based scoring
  if (myrcene > 0.5) indicaScore += 2;
  else if (myrcene > 0.3) indicaScore += 1;

  if (limonene > 0.3) sativaScore += 2;
  if (pinene > 0.2) sativaScore += 1;

  const diff = sativaScore - indicaScore;

  if (diff >= 4) return 'Sativa';
  if (diff >= 2) return 'Sativa-Dominant';
  if (diff <= -4) return 'Indica';
  if (diff <= -2) return 'Indica-Dominant';
  return 'Balanced Hybrid';
}

// 25 popular strains with their Cannlytics data
const strainData: StrainData[] = [
  { name: "Blue Dream", thc: 21, effects: ['effect_happy', 'effect_relaxed', 'effect_uplifted', 'effect_creative', 'effect_euphoric'], aromas: ['aroma_blueberry', 'aroma_sweet', 'aroma_berry'], myrcene: 0.26, limonene: 0.50, pinene: 0.08, linalool: 0.36, caryophyllene: 0.22 },
  { name: "OG Kush", thc: 23, effects: ['effect_happy', 'effect_relaxed', 'effect_euphoric', 'effect_uplifted'], aromas: ['aroma_earthy', 'aroma_pine', 'aroma_woody'], myrcene: 0.45, limonene: 0.35, pinene: 0.12, linalool: 0.15, caryophyllene: 0.28 },
  { name: "Gelato", thc: 22, effects: ['effect_happy', 'effect_relaxed', 'effect_uplifted', 'effect_creative', 'effect_euphoric', 'effect_tingly'], aromas: ['aroma_sweet', 'aroma_flowery', 'aroma_citrus'], myrcene: 0.11, limonene: 0.40, pinene: 0.07, linalool: 0.17, caryophyllene: 0.25 },
  { name: "Girl Scout Cookies", thc: 25, effects: ['effect_happy', 'effect_relaxed', 'effect_euphoric', 'effect_uplifted', 'effect_creative'], aromas: ['aroma_sweet', 'aroma_earthy', 'aroma_pungent'], myrcene: 0.38, limonene: 0.42, pinene: 0.08, linalool: 0.22, caryophyllene: 0.35 },
  { name: "Sour Diesel", thc: 22, effects: ['effect_happy', 'effect_uplifted', 'effect_creative', 'effect_energetic', 'effect_euphoric'], aromas: ['aroma_diesel', 'aroma_pungent', 'aroma_earthy'], myrcene: 0.18, limonene: 0.55, pinene: 0.15, linalool: 0.08, caryophyllene: 0.32 },
  { name: "Granddaddy Purple", thc: 20, effects: ['effect_relaxed', 'effect_sleepy', 'effect_happy', 'effect_euphoric', 'effect_hungry'], aromas: ['aroma_grape', 'aroma_berry', 'aroma_sweet'], myrcene: 0.65, limonene: 0.12, pinene: 0.05, linalool: 0.28, caryophyllene: 0.18 },
  { name: "Jack Herer", thc: 19, effects: ['effect_happy', 'effect_uplifted', 'effect_creative', 'effect_energetic', 'effect_focused'], aromas: ['aroma_pine', 'aroma_earthy', 'aroma_woody'], myrcene: 0.15, limonene: 0.35, pinene: 0.45, linalool: 0.05, caryophyllene: 0.20 },
  { name: "White Widow", thc: 20, effects: ['effect_happy', 'effect_uplifted', 'effect_euphoric', 'effect_creative', 'effect_energetic'], aromas: ['aroma_earthy', 'aroma_woody', 'aroma_pungent'], myrcene: 0.25, limonene: 0.30, pinene: 0.18, linalool: 0.12, caryophyllene: 0.22 },
  { name: "Northern Lights", thc: 18, effects: ['effect_relaxed', 'effect_sleepy', 'effect_happy', 'effect_euphoric'], aromas: ['aroma_earthy', 'aroma_pine', 'aroma_sweet'], myrcene: 0.58, limonene: 0.08, pinene: 0.12, linalool: 0.35, caryophyllene: 0.15 },
  { name: "Gorilla Glue #4", thc: 28, effects: ['effect_relaxed', 'effect_happy', 'effect_euphoric', 'effect_uplifted', 'effect_sleepy'], aromas: ['aroma_earthy', 'aroma_pine', 'aroma_pungent', 'aroma_diesel'], myrcene: 0.42, limonene: 0.28, pinene: 0.15, linalool: 0.18, caryophyllene: 0.45 },
  { name: "Pineapple Express", thc: 19, effects: ['effect_happy', 'effect_uplifted', 'effect_creative', 'effect_energetic', 'effect_focused'], aromas: ['aroma_tropical', 'aroma_pineapple', 'aroma_citrus'], myrcene: 0.22, limonene: 0.48, pinene: 0.12, linalool: 0.10, caryophyllene: 0.18 },
  { name: "Purple Haze", thc: 17, effects: ['effect_happy', 'effect_uplifted', 'effect_creative', 'effect_energetic', 'effect_euphoric'], aromas: ['aroma_earthy', 'aroma_berry', 'aroma_sweet'], myrcene: 0.18, limonene: 0.42, pinene: 0.15, linalool: 0.12, caryophyllene: 0.20 },
  { name: "Wedding Cake", thc: 25, effects: ['effect_relaxed', 'effect_happy', 'effect_euphoric', 'effect_uplifted'], aromas: ['aroma_sweet', 'aroma_vanilla', 'aroma_earthy'], myrcene: 0.35, limonene: 0.38, pinene: 0.08, linalool: 0.25, caryophyllene: 0.32 },
  { name: "Green Crack", thc: 18, effects: ['effect_energetic', 'effect_focused', 'effect_happy', 'effect_uplifted', 'effect_creative'], aromas: ['aroma_citrus', 'aroma_mango', 'aroma_earthy'], myrcene: 0.38, limonene: 0.45, pinene: 0.08, linalool: 0.05, caryophyllene: 0.15 },
  { name: "AK-47", thc: 20, effects: ['effect_happy', 'effect_relaxed', 'effect_uplifted', 'effect_euphoric', 'effect_creative'], aromas: ['aroma_earthy', 'aroma_pungent', 'aroma_woody'], myrcene: 0.32, limonene: 0.28, pinene: 0.15, linalool: 0.18, caryophyllene: 0.25 },
  { name: "Trainwreck", thc: 21, effects: ['effect_happy', 'effect_uplifted', 'effect_euphoric', 'effect_creative', 'effect_energetic'], aromas: ['aroma_pine', 'aroma_earthy', 'aroma_lemon'], myrcene: 0.22, limonene: 0.42, pinene: 0.25, linalool: 0.08, caryophyllene: 0.22 },
  { name: "Durban Poison", thc: 17, effects: ['effect_energetic', 'effect_uplifted', 'effect_creative', 'effect_focused', 'effect_happy'], aromas: ['aroma_sweet', 'aroma_pine', 'aroma_earthy'], myrcene: 0.12, limonene: 0.38, pinene: 0.32, linalool: 0.05, caryophyllene: 0.18 },
  { name: "Bubba Kush", thc: 22, effects: ['effect_relaxed', 'effect_sleepy', 'effect_happy', 'effect_hungry'], aromas: ['aroma_earthy', 'aroma_coffee', 'aroma_sweet'], myrcene: 0.55, limonene: 0.15, pinene: 0.08, linalool: 0.32, caryophyllene: 0.22 },
  { name: "Skywalker OG", thc: 24, effects: ['effect_relaxed', 'effect_sleepy', 'effect_happy', 'effect_euphoric', 'effect_hungry'], aromas: ['aroma_earthy', 'aroma_diesel', 'aroma_pine'], myrcene: 0.48, limonene: 0.22, pinene: 0.12, linalool: 0.25, caryophyllene: 0.35 },
  { name: "Strawberry Cough", thc: 18, effects: ['effect_happy', 'effect_uplifted', 'effect_creative', 'effect_focused', 'effect_energetic'], aromas: ['aroma_strawberry', 'aroma_sweet', 'aroma_berry'], myrcene: 0.18, limonene: 0.45, pinene: 0.12, linalool: 0.15, caryophyllene: 0.15 },
  { name: "ACDC", thc: 1, effects: ['effect_relaxed', 'effect_focused', 'effect_happy'], aromas: ['aroma_earthy', 'aroma_woody', 'aroma_pine'], myrcene: 0.31, limonene: 0.03, pinene: 0.11, linalool: 0.00, caryophyllene: 0.07 },
  { name: "Chemdawg", thc: 22, effects: ['effect_happy', 'effect_uplifted', 'effect_relaxed', 'effect_creative', 'effect_euphoric'], aromas: ['aroma_diesel', 'aroma_earthy', 'aroma_pungent'], myrcene: 0.28, limonene: 0.35, pinene: 0.15, linalool: 0.12, caryophyllene: 0.38 },
  { name: "Blue Cheese", thc: 19, effects: ['effect_relaxed', 'effect_happy', 'effect_sleepy', 'effect_euphoric'], aromas: ['aroma_cheese', 'aroma_blueberry', 'aroma_earthy'], myrcene: 0.45, limonene: 0.18, pinene: 0.08, linalool: 0.28, caryophyllene: 0.22 },
  { name: "Lemon Haze", thc: 18, effects: ['effect_happy', 'effect_uplifted', 'effect_energetic', 'effect_creative', 'effect_focused'], aromas: ['aroma_lemon', 'aroma_citrus', 'aroma_sweet'], myrcene: 0.15, limonene: 0.62, pinene: 0.18, linalool: 0.08, caryophyllene: 0.18 },
  { name: "Zkittlez", thc: 20, effects: ['effect_relaxed', 'effect_happy', 'effect_euphoric', 'effect_sleepy', 'effect_focused'], aromas: ['aroma_sweet', 'aroma_berry', 'aroma_tropical'], myrcene: 0.35, limonene: 0.32, pinene: 0.08, linalool: 0.22, caryophyllene: 0.25 },
];

async function main() {
  console.log('Seeding database with 25 popular strains...\n');

  for (const data of strainData) {
    console.log(`Processing ${data.name}...`);

    // Calculate base effect profile
    const baseProfile = mapToEffectRatings(data);
    const strainType = inferStrainType(data);

    console.log(`  Type: ${strainType}`);
    console.log(`  Base profile: Potency=${baseProfile.Potency}, Euphoria=${baseProfile.Euphoria}, Energy=${baseProfile.Energy}, Relaxation=${baseProfile.Relaxation}`);

    // Create strain
    const strain = await prisma.strain.upsert({
      where: { name: data.name },
      update: {
        genetics: `${data.name} genetics`,
        strainType,
        thcPercent: data.thc,
        cbdPercent: data.name === 'ACDC' ? 15 : Math.random() * 2,
      },
      create: {
        name: data.name,
        genetics: `${data.name} genetics`,
        strainType,
        thcPercent: data.thc,
        cbdPercent: data.name === 'ACDC' ? 15 : Math.random() * 2,
      },
    });

    // Delete existing ratings for this strain (to allow re-seeding)
    await prisma.rating.deleteMany({
      where: { strainId: strain.id },
    });

    // Create 15 ratings with variations
    const ratingCount = 15;
    for (let i = 0; i < ratingCount; i++) {
      const variedProfile = addVariation(baseProfile, 1.2); // ±1.2 variance for consensus effect

      // Calculate overall rating based on the varied profile
      const avgEffect = Object.values(variedProfile).reduce((a, b) => a + b, 0) / 13;
      const overallRating = clamp(Math.round(avgEffect + (Math.random() - 0.5) * 2), 1, 10);

      await prisma.rating.create({
        data: {
          strainId: strain.id,
          effectRatings: variedProfile,
          strainType,
          overallRating,
          notes: i === 0 ? `Great ${strainType.toLowerCase()} strain with notable effects!` : null,
        },
      });
    }

    console.log(`  Created ${ratingCount} ratings\n`);
  }

  console.log('Done! Seeded 25 strains with 375 total ratings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
