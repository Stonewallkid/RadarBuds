/**
 * Cannabis API client using Cannlytics API
 * Documentation: https://docs.cannlytics.com/api/data/strains/
 */

const CANNLYTICS_BASE_URL = 'https://cannlytics.com/api/data/strains';

export interface CannlyticsStrain {
  id: string;
  strain_name: string;
  description?: string;
  image_url?: string;
  tests?: number;
  total_favorites?: number;
  // Cannabinoids are at top level in API response
  delta_9_thc?: number;
  total_thc?: number;
  cbd?: number;
  total_cbd?: number;
  cbg?: number;
  cbn?: number;
  thcv?: number;
  cbc?: number;
  total_cannabinoids?: number;
  // Terpenes are at top level
  total_terpenes?: number;
  beta_myrcene?: number;
  d_limonene?: number;
  beta_caryophyllene?: number;
  alpha_pinene?: number;
  linalool?: number;
  humulene?: number;
  // Effects and aromas at top level
  potential_effects?: string[];
  potential_aromas?: string[];
  keywords?: string[];
  updated_at?: string;
}

export interface SearchParams {
  query?: string;
  limit?: number;
  effects?: string[];
  aromas?: string[];
  minThc?: number;
  maxThc?: number;
}

export interface StrainSearchResult {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  thcPercent?: number;
  cbdPercent?: number;
  effects?: string[];
  aromas?: string[];
  strainType?: 'Indica' | 'Indica-Dominant' | 'Balanced Hybrid' | 'Sativa-Dominant' | 'Sativa';
}

// Map Cannlytics effect names to display names
function parseEffects(effects?: string[]): string[] {
  if (!effects) return [];
  return effects.map(e => {
    // Convert "effect_relaxed" to "Relaxed"
    return e.replace('effect_', '').replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}

// Map Cannlytics aroma names to display names
function parseAromas(aromas?: string[]): string[] {
  if (!aromas) return [];
  return aromas.map(a => {
    // Convert "aroma_earthy" to "Earthy"
    return a.replace('aroma_', '').replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}

// Infer strain type from effects and terpenes
function inferStrainType(strain: CannlyticsStrain): StrainSearchResult['strainType'] {
  const effects = strain.potential_effects || [];

  // Sativa indicators: energetic, creative, uplifted, focused
  const sativaEffects = effects.filter(e =>
    /energetic|creative|uplifted|focused|happy|euphoric/i.test(e)
  ).length;

  // Indica indicators: relaxed, sleepy, hungry
  const indicaEffects = effects.filter(e =>
    /relaxed|sleepy|hungry|calm|sedated/i.test(e)
  ).length;

  // Terpene profile can also indicate type (terpenes are at top level)
  const myrcene = strain.beta_myrcene || 0;
  const limonene = strain.d_limonene || 0;
  const pinene = strain.alpha_pinene || 0;

  // High myrcene often indicates indica
  const indicaTerpeneScore = myrcene > 0.5 ? 2 : myrcene > 0.3 ? 1 : 0;
  // High limonene/pinene often indicates sativa
  const sativaTerpeneScore = (limonene > 0.3 ? 1 : 0) + (pinene > 0.2 ? 1 : 0);

  const indicaScore = indicaEffects + indicaTerpeneScore;
  const sativaScore = sativaEffects + sativaTerpeneScore;

  if (sativaScore > indicaScore + 2) return 'Sativa';
  if (sativaScore > indicaScore) return 'Sativa-Dominant';
  if (indicaScore > sativaScore + 2) return 'Indica';
  if (indicaScore > sativaScore) return 'Indica-Dominant';
  return 'Balanced Hybrid';
}

// Transform Cannlytics response to our format
function transformStrain(strain: CannlyticsStrain): StrainSearchResult {
  return {
    id: strain.id,
    name: strain.strain_name,
    description: strain.description,
    imageUrl: strain.image_url,
    thcPercent: strain.delta_9_thc || strain.total_thc,
    cbdPercent: strain.cbd || strain.total_cbd,
    effects: parseEffects(strain.potential_effects),
    aromas: parseAromas(strain.potential_aromas),
    strainType: inferStrainType(strain),
  };
}

/**
 * Search for strains using Cannlytics API
 * Note: Cannlytics doesn't have native name search, so we fetch more and filter client-side
 */
export async function searchStrains(params: SearchParams): Promise<StrainSearchResult[]> {
  const searchParams = new URLSearchParams();

  // Request more results for client-side filtering when searching by name
  const fetchLimit = params.query ? 100 : (params.limit || 10);
  searchParams.set('limit', String(fetchLimit));

  // Order alphabetically for more predictable results
  searchParams.set('order', 'strain_name');

  // Effects filter
  if (params.effects && params.effects.length > 0) {
    searchParams.set('effects', params.effects.join(','));
  }

  // Aromas filter
  if (params.aromas && params.aromas.length > 0) {
    searchParams.set('aromas', params.aromas.join(','));
  }

  // THC filter
  if (params.minThc !== undefined) {
    searchParams.set('total_thc', `ge${params.minThc}`);
  }
  if (params.maxThc !== undefined) {
    const current = searchParams.get('total_thc');
    if (current) {
      searchParams.set('total_thc', `${current}+le${params.maxThc}`);
    } else {
      searchParams.set('total_thc', `le${params.maxThc}`);
    }
  }

  try {
    const url = `${CANNLYTICS_BASE_URL}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Cannlytics API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.data)) {
      return [];
    }

    let results = data.data.map(transformStrain);

    // Client-side name filtering if query provided
    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter((strain: StrainSearchResult) =>
        strain.name.toLowerCase().includes(query) ||
        (strain.description && strain.description.toLowerCase().includes(query))
      );
    }

    // Return only the requested limit after filtering
    return results.slice(0, params.limit || 10);
  } catch (error) {
    console.error('Error searching strains:', error);
    return [];
  }
}

/**
 * Get a specific strain by name
 */
export async function getStrainByName(name: string): Promise<StrainSearchResult | null> {
  try {
    const encodedName = encodeURIComponent(name);
    const response = await fetch(`${CANNLYTICS_BASE_URL}/${encodedName}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return null;
    }

    return transformStrain(data.data);
  } catch (error) {
    console.error('Error fetching strain:', error);
    return null;
  }
}

/**
 * Get popular/featured strains
 */
export async function getPopularStrains(limit: number = 20): Promise<StrainSearchResult[]> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      order: 'total_favorites',
      desc: 'true',
    });

    const response = await fetch(`${CANNLYTICS_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Cannlytics API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map(transformStrain);
  } catch (error) {
    console.error('Error fetching popular strains:', error);
    return [];
  }
}
