import { EffectRatings, StrainType, BudAppearance, StrainInfo } from '@/types/strain';

const API_BASE = '/api';

// User management (simple anonymous user for now)
export async function getOrCreateUser(): Promise<{ id: string; name: string }> {
  // Check localStorage for existing user
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('radarbuds_user');
    if (stored) {
      return JSON.parse(stored);
    }
  }

  // Create anonymous user
  const anonId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${anonId}@anonymous.radarbuds`,
      name: 'Anonymous Rater',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  const user = await response.json();
  const userData = { id: user.id, name: user.name };

  if (typeof window !== 'undefined') {
    localStorage.setItem('radarbuds_user', JSON.stringify(userData));
  }

  return userData;
}

// Strains
export async function searchStrains(query?: string) {
  const params = query ? `?search=${encodeURIComponent(query)}` : '';
  const response = await fetch(`${API_BASE}/strains${params}`);
  if (!response.ok) throw new Error('Failed to fetch strains');
  return response.json();
}

export async function getStrain(id: string) {
  const response = await fetch(`${API_BASE}/strains/${id}`);
  if (!response.ok) throw new Error('Failed to fetch strain');
  return response.json();
}

export async function getStrainStats(id: string) {
  const response = await fetch(`${API_BASE}/strains/${id}/stats`);
  if (!response.ok) throw new Error('Failed to fetch strain stats');
  return response.json();
}

// Ratings
export interface CreateRatingData {
  strain: StrainInfo;
  strainType: StrainType;
  budAppearance?: BudAppearance;
  effectRatings: EffectRatings;
  overallRating: number;
  notes?: string;
  tasteTags?: string[];
  displayName?: string;
}

export async function createRating(data: CreateRatingData) {
  const user = await getOrCreateUser();

  // Update user name if provided and different
  if (data.displayName && data.displayName !== user.name) {
    user.name = data.displayName;
    if (typeof window !== 'undefined') {
      localStorage.setItem('radarbuds_user', JSON.stringify(user));
    }
    // Update in database
    await fetch(`${API_BASE}/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.displayName }),
    }).catch(() => {
      // Ignore errors updating user name
    });
  }

  const response = await fetch(`${API_BASE}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      strain: data.strain,
      effectRatings: data.effectRatings,
      strainType: data.strainType,
      budAppearance: data.budAppearance,
      overallRating: data.overallRating,
      notes: data.notes,
      effectTags: data.tasteTags,
      imageUrl: data.strain.imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create rating');
  }

  return response.json();
}

export async function getUserRatings() {
  const user = await getOrCreateUser();
  const response = await fetch(`${API_BASE}/ratings?userId=${user.id}`);
  if (!response.ok) throw new Error('Failed to fetch ratings');
  return response.json();
}

export async function deleteRating(ratingId: string) {
  const user = await getOrCreateUser();
  const response = await fetch(`${API_BASE}/ratings/${ratingId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
  if (!response.ok) throw new Error('Failed to delete rating');
  return response.json();
}

// User profile
export async function getUserProfile() {
  const user = await getOrCreateUser();
  const response = await fetch(`${API_BASE}/profile?userId=${user.id}`);
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

// Top strains
export async function getTopStrains(limit = 10) {
  const response = await fetch(`${API_BASE}/strains/top?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top strains');
  return response.json();
}

// Recent ratings
export async function getRecentRatings(limit = 10) {
  const response = await fetch(`${API_BASE}/strains/recent?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch recent ratings');
  return response.json();
}
