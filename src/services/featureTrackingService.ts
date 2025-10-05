// Feature Tracking Service - Automatically tracks features from Git commits
export interface FeatureStatus {
  id: string;
  title: string;
  description: string;
  status: 'released' | 'coming-soon' | 'in-development' | 'planned';
  dateAdded: string;
  commitHash?: string;
  estimatedRelease?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  date: string;
  author: string;
}

class FeatureTrackingService {
  private features: FeatureStatus[] = [];
  private readonly FEATURE_KEYWORDS = [
    'feature:', 'feat:', 'add:', 'new:', 'implement:', 'create:',
    'coming soon', 'wip:', 'todo:', 'placeholder'
  ];

  private readonly COMPLETION_KEYWORDS = [
    'complete:', 'finish:', 'done:', 'ready:', 'deploy:', 'release:'
  ];

  /**
   * Parse commit messages to extract feature information
   */
  parseCommitForFeatures(commit: CommitInfo): FeatureStatus[] {
    const message = commit.message.toLowerCase();
    const features: FeatureStatus[] = [];

    // Check if commit indicates a new feature
    const isFeatureCommit = this.FEATURE_KEYWORDS.some(keyword => 
      message.includes(keyword)
    );

    const isCompletionCommit = this.COMPLETION_KEYWORDS.some(keyword =>
      message.includes(keyword)
    );

    if (isFeatureCommit) {
      const feature: FeatureStatus = {
        id: `feature-${commit.hash.substring(0, 8)}`,
        title: this.extractFeatureTitle(commit.message),
        description: this.extractFeatureDescription(commit.message),
        status: this.determineFeatureStatus(commit.message),
        dateAdded: commit.date,
        commitHash: commit.hash
      };

      // Add estimated release date for coming soon features
      if (feature.status === 'coming-soon') {
        feature.estimatedRelease = this.estimateReleaseDate(commit.date);
      }

      features.push(feature);
    }

    return features;
  }

  /**
   * Extract feature title from commit message
   */
  private extractFeatureTitle(message: string): string {
    // Remove common prefixes and clean up
    let title = message
      .replace(/^(feat|feature|add|new|implement|create):\s*/i, '')
      .replace(/\s*\([^)]*\)/g, '') // Remove scope in parentheses
      .split('\n')[0] // Take first line only
      .trim();

    // Capitalize first letter
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  /**
   * Extract feature description from commit message
   */
  private extractFeatureDescription(message: string): string {
    const lines = message.split('\n');
    if (lines.length > 1) {
      return lines.slice(1).join(' ').trim();
    }
    return this.extractFeatureTitle(message);
  }

  /**
   * Determine feature status based on commit message
   */
  private determineFeatureStatus(message: string): FeatureStatus['status'] {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('coming soon') || lowerMessage.includes('placeholder')) {
      return 'coming-soon';
    }
    
    if (lowerMessage.includes('wip:') || lowerMessage.includes('in progress')) {
      return 'in-development';
    }
    
    if (lowerMessage.includes('todo:') || lowerMessage.includes('planned')) {
      return 'planned';
    }

    // Default to released if it's a feature commit without specific status
    return 'released';
  }

  /**
   * Estimate release date (simple logic - can be enhanced)
   */
  private estimateReleaseDate(commitDate: string): string {
    const date = new Date(commitDate);
    date.setDate(date.getDate() + 14); // Estimate 2 weeks from commit
    return date.toISOString().split('T')[0];
  }

  /**
   * Get features with "coming soon" status for UI display
   */
  getComingSoonFeatures(): FeatureStatus[] {
    return this.features.filter(f => f.status === 'coming-soon');
  }

  /**
   * Get recently released features for "What's New"
   */
  getRecentlyReleasedFeatures(days: number = 30): FeatureStatus[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.features
      .filter(f => f.status === 'released')
      .filter(f => new Date(f.dateAdded) >= cutoffDate)
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }

  /**
   * Update feature status when it's completed
   */
  markFeatureAsReleased(featureId: string): void {
    const feature = this.features.find(f => f.id === featureId);
    if (feature) {
      feature.status = 'released';
      feature.estimatedRelease = undefined;
    }
  }

  /**
   * Check if a navigation path should show "coming soon"
   */
  shouldShowComingSoon(path: string): boolean {
    // Map paths to feature keywords
    const pathFeatureMap: Record<string, string[]> = {
      '/goals': ['goal', 'reflection', 'goals & reflections'],
      '/journey': ['journey', 'progress', 'timeline'],
      '/mentor-matching': ['mentor matching', 'mentor assignment'],
      '/analytics': ['analytics', 'reports', 'insights']
    };

    const keywords = pathFeatureMap[path] || [];
    const comingSoonFeatures = this.getComingSoonFeatures();

    return comingSoonFeatures.some(feature => 
      keywords.some(keyword => 
        feature.title.toLowerCase().includes(keyword) ||
        feature.description.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Initialize with mock data for demonstration
   */
  initializeMockData(): void {
    this.features = [
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
        id: 'feature-house-colors',
        title: 'House-based Color Theming',
        description: 'Personalized color themes based on student house assignment',
        status: 'released',
        dateAdded: '2025-10-05'
      },
      {
        id: 'feature-whats-new',
        title: 'What\'s New Feature Announcements',
        description: 'Modal system for announcing new features and updates',
        status: 'released',
        dateAdded: '2025-10-05'
      }
    ];
  }
}

export const featureTrackingService = new FeatureTrackingService();

// Initialize with mock data for now - in production, this would read from Git
featureTrackingService.initializeMockData();