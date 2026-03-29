import {
  EFFECT_DIMENSIONS,
  STRAIN_TYPES,
  BUD_APPEARANCES,
  createEmptyRatings,
  DIMENSION_QUESTIONS,
  EffectDimension,
} from '@/types/strain';

describe('Strain Types', () => {
  test('EFFECT_DIMENSIONS has exactly 13 dimensions', () => {
    expect(EFFECT_DIMENSIONS).toHaveLength(13);
  });

  test('EFFECT_DIMENSIONS contains expected dimensions', () => {
    expect(EFFECT_DIMENSIONS).toContain('Potency');
    expect(EFFECT_DIMENSIONS).toContain('Euphoria');
    expect(EFFECT_DIMENSIONS).toContain('Creativity');
    expect(EFFECT_DIMENSIONS).toContain('Focus');
    expect(EFFECT_DIMENSIONS).toContain('Energy');
    expect(EFFECT_DIMENSIONS).toContain('Relaxation');
    expect(EFFECT_DIMENSIONS).toContain('Sleep Aid');
    expect(EFFECT_DIMENSIONS).toContain('Pain Relief');
    expect(EFFECT_DIMENSIONS).toContain('Anxiety Relief');
    expect(EFFECT_DIMENSIONS).toContain('Munchies');
    expect(EFFECT_DIMENSIONS).toContain('Smoothness');
    expect(EFFECT_DIMENSIONS).toContain('Aroma');
    expect(EFFECT_DIMENSIONS).toContain('Flavor');
  });

  test('STRAIN_TYPES has exactly 5 types', () => {
    expect(STRAIN_TYPES).toHaveLength(5);
  });

  test('STRAIN_TYPES contains expected types', () => {
    expect(STRAIN_TYPES).toContain('Indica');
    expect(STRAIN_TYPES).toContain('Indica-Dominant');
    expect(STRAIN_TYPES).toContain('Balanced Hybrid');
    expect(STRAIN_TYPES).toContain('Sativa-Dominant');
    expect(STRAIN_TYPES).toContain('Sativa');
  });

  test('BUD_APPEARANCES has exactly 6 appearances', () => {
    expect(BUD_APPEARANCES).toHaveLength(6);
  });

  test('BUD_APPEARANCES contains expected appearances', () => {
    expect(BUD_APPEARANCES).toContain('Light Green');
    expect(BUD_APPEARANCES).toContain('Forest Green');
    expect(BUD_APPEARANCES).toContain('Purple');
    expect(BUD_APPEARANCES).toContain('Orange-Tinged');
    expect(BUD_APPEARANCES).toContain('Frosty');
    expect(BUD_APPEARANCES).toContain('Dark');
  });
});

describe('createEmptyRatings', () => {
  test('returns object with all 13 dimensions', () => {
    const ratings = createEmptyRatings();
    expect(Object.keys(ratings)).toHaveLength(13);
  });

  test('initializes all dimensions to 0', () => {
    const ratings = createEmptyRatings();
    EFFECT_DIMENSIONS.forEach((dim) => {
      expect(ratings[dim]).toBe(0);
    });
  });
});

describe('DIMENSION_QUESTIONS', () => {
  test('has questions for all 13 dimensions', () => {
    EFFECT_DIMENSIONS.forEach((dim) => {
      expect(DIMENSION_QUESTIONS[dim as EffectDimension]).toBeDefined();
    });
  });

  test('each dimension has required question properties', () => {
    EFFECT_DIMENSIONS.forEach((dim) => {
      const question = DIMENSION_QUESTIONS[dim as EffectDimension];
      expect(question.question).toBeDefined();
      expect(question.lowLabel).toBeDefined();
      expect(question.highLabel).toBeDefined();
      expect(question.explanation).toBeDefined();
      expect(typeof question.question).toBe('string');
      expect(typeof question.lowLabel).toBe('string');
      expect(typeof question.highLabel).toBe('string');
      expect(typeof question.explanation).toBe('string');
    });
  });

  test('explanations are detailed (at least 50 characters)', () => {
    EFFECT_DIMENSIONS.forEach((dim) => {
      const question = DIMENSION_QUESTIONS[dim as EffectDimension];
      expect(question.explanation.length).toBeGreaterThanOrEqual(50);
    });
  });
});
