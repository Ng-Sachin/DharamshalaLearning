import { useState, useEffect } from 'react';

export interface FeatureStatus {
  id: string;
  title: string;
  description: string;
  status: 'released' | 'coming-soon' | 'in-development' | 'planned';
  dateAdded: string;
  commitHash?: string;
  estimatedRelease?: string;
  author?: string;
}

export interface FeaturesManifest {
  generatedAt: string;
  version: string;
  features: {
    all: FeatureStatus[];
    released: FeatureStatus[];
    comingSoon: FeatureStatus[];
    inDevelopment: FeatureStatus[];
    planned: FeatureStatus[];
  };
  pathMappings: Record<string, string>;
}

/**
 * Custom hook for managing features loaded from deployment-time manifest
 */
export function useFeaturesManifest() {
  const [manifest, setManifest] = useState<FeaturesManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturesManifest();
  }, []);

  const loadFeaturesManifest = async () => {
    try {
      // Try to load the generated features manifest
      const response = await fetch('/features.json');
      
      if (response.ok) {
        const data = await response.json();
        setManifest(data);
      } else {
        // Fallback to static data if manifest doesn't exist
        setManifest(getFallbackManifest());
      }
    } catch (err) {
      console.warn('Could not load features manifest, using fallback');
      setManifest(getFallbackManifest());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a path should show "Coming Soon"
   */
  const shouldShowComingSoon = (path: string): boolean => {
    if (!manifest) return false;
    return manifest.pathMappings[path] === 'coming-soon';
  };

  /**
   * Get features for "What's New" modal
   */
  const getWhatsNewFeatures = (days: number = 30): FeatureStatus[] => {
    if (!manifest) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return manifest.features.released
      .filter(feature => new Date(feature.dateAdded) >= cutoffDate)
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 10); // Limit to 10 most recent
  };

  /**
   * Get coming soon features with estimated dates
   */
  const getComingSoonFeatures = (): FeatureStatus[] => {
    if (!manifest) return [];
    return manifest.features.comingSoon;
  };

  /**
   * Get feature status by path
   */
  const getFeatureStatusByPath = (path: string): 'available' | 'coming-soon' | 'in-development' => {
    if (!manifest) return 'available';
    return manifest.pathMappings[path] as any || 'available';
  };

  return {
    manifest,
    loading,
    error,
    shouldShowComingSoon,
    getWhatsNewFeatures,
    getComingSoonFeatures,
    getFeatureStatusByPath,
    refresh: loadFeaturesManifest
  };
}

/**
 * Fallback manifest when the generated one isn't available
 */
function getFallbackManifest(): FeaturesManifest {
  const fallbackFeatures: FeatureStatus[] = [
    {
      id: 'feature-house-colors',
      title: 'House-based Color Theming',
      description: 'Personalized color themes based on student house assignment (Bageshree-blue, Bhairav-orange, Malhar-green)',
      status: 'released',
      dateAdded: '2025-10-05'
    },
    {
      id: 'feature-whats-new',
      title: 'What\'s New Feature Announcements',
      description: 'Modal system for announcing new features and updates to users',
      status: 'released',
      dateAdded: '2025-10-05'
    },
    {
      id: 'feature-bug-reporting',
      title: 'Bug & Feature Reporting System',
      description: 'Context menu system for users to report bugs and request features',
      status: 'released',
      dateAdded: '2025-10-04'
    },
    {
      id: 'feature-goals-system',
      title: 'Goals & Reflections System',
      description: 'Complete goal setting and daily reflection system with progress tracking',
      status: 'coming-soon',
      dateAdded: '2025-10-01',
      estimatedRelease: '2025-10-15'
    },
    {
      id: 'feature-journey-timeline',
      title: 'Learning Journey Timeline',
      description: 'Visual timeline showing student progress through curriculum phases',
      status: 'coming-soon',
      dateAdded: '2025-10-02',
      estimatedRelease: '2025-10-20'
    },
    {
      id: 'feature-mentor-matching',
      title: 'Advanced Mentor Matching',
      description: 'AI-powered mentor-mentee matching based on skills and preferences',
      status: 'in-development',
      dateAdded: '2025-09-28'
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    features: {
      all: fallbackFeatures,
      released: fallbackFeatures.filter(f => f.status === 'released'),
      comingSoon: fallbackFeatures.filter(f => f.status === 'coming-soon'),
      inDevelopment: fallbackFeatures.filter(f => f.status === 'in-development'),
      planned: fallbackFeatures.filter(f => f.status === 'planned')
    },
    pathMappings: {
      '/goals': 'coming-soon',
      '/journey': 'coming-soon',
      '/mentor-matching': 'in-development',
      '/analytics': 'coming-soon'
    }
  };
}