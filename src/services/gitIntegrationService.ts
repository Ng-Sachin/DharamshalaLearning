// Git Integration Service - Reads actual Git commit history
import { CommitInfo, FeatureStatus } from './featureTrackingService';

class GitIntegrationService {
  /**
   * Fetch recent commits from Git history
   * In a real deployment, this would run as a build-time script
   */
  async fetchRecentCommits(limit: number = 50): Promise<CommitInfo[]> {
    try {
      // This would be executed during build time in a real deployment
      // For now, return mock data that represents what Git would provide
      return this.getMockCommitHistory();
    } catch (error) {
      console.error('Failed to fetch Git commits:', error);
      return [];
    }
  }

  /**
   * Mock commit history - in production, replace with actual Git integration
   */
  private getMockCommitHistory(): CommitInfo[] {
    return [
      {
        hash: 'a1b2c3d4',
        message: 'feat: Add house-based color theming to navigation\n\nImplemented personalized colors for Bageshree (blue), Bhairav (orange), and Malhar (green) houses',
        date: '2025-10-05T10:30:00Z',
        author: 'Developer'
      },
      {
        hash: 'e5f6g7h8',
        message: 'feat: Coming soon - Goals & Reflections system\n\nPlaceholder implementation for student goal setting and daily reflections',
        date: '2025-10-04T14:15:00Z',
        author: 'Developer'
      },
      {
        hash: 'i9j0k1l2',
        message: 'feat: What\'s New modal for feature announcements\n\nAdded modal system to announce new features with dates',
        date: '2025-10-05T16:45:00Z',
        author: 'Developer'
      },
      {
        hash: 'm3n4o5p6',
        message: 'feat: Coming soon - Learning Journey timeline\n\nWIP: Visual progress tracking through curriculum phases',
        date: '2025-10-03T09:20:00Z',
        author: 'Developer'
      },
      {
        hash: 'q7r8s9t0',
        message: 'fix: Remove duplicate campus options from profile\n\nCleaned up profile section by removing redundant campus selector',
        date: '2025-10-05T11:00:00Z',
        author: 'Developer'
      }
    ];
  }

  /**
   * Build-time script that would run during deployment
   * This generates a features.json file that the app can load
   */
  async generateFeaturesManifest(): Promise<void> {
    const commits = await this.fetchRecentCommits();
    const features: FeatureStatus[] = [];

    commits.forEach(commit => {
      const commitFeatures = this.parseCommitForFeatures(commit);
      features.push(...commitFeatures);
    });

    // In a real deployment, this would write to public/features.json
    console.log('Generated features manifest:', features);
  }

  /**
   * Parse commit message to extract features
   */
  private parseCommitForFeatures(commit: CommitInfo): FeatureStatus[] {
    const message = commit.message.toLowerCase();
    const features: FeatureStatus[] = [];

    // Feature detection keywords
    const featureKeywords = ['feat:', 'feature:', 'add:', 'new:', 'implement:'];
    const isFeatureCommit = featureKeywords.some(keyword => message.includes(keyword));

    if (isFeatureCommit) {
      const status = this.determineStatus(commit.message);
      
      const feature: FeatureStatus = {
        id: `feature-${commit.hash}`,
        title: this.extractTitle(commit.message),
        description: this.extractDescription(commit.message),
        status,
        dateAdded: commit.date,
        commitHash: commit.hash
      };

      if (status === 'coming-soon') {
        feature.estimatedRelease = this.estimateReleaseDate(commit.date);
      }

      features.push(feature);
    }

    return features;
  }

  private determineStatus(message: string): FeatureStatus['status'] {
    const lower = message.toLowerCase();
    
    if (lower.includes('coming soon') || lower.includes('placeholder')) {
      return 'coming-soon';
    }
    if (lower.includes('wip:') || lower.includes('work in progress')) {
      return 'in-development';
    }
    if (lower.includes('todo:') || lower.includes('planned')) {
      return 'planned';
    }
    
    return 'released';
  }

  private extractTitle(message: string): string {
    return message
      .split('\n')[0]
      .replace(/^(feat|feature|add|new|implement):\s*/i, '')
      .replace(/coming soon\s*-\s*/i, '')
      .trim();
  }

  private extractDescription(message: string): string {
    const lines = message.split('\n');
    return lines.length > 1 ? lines.slice(1).join(' ').trim() : this.extractTitle(message);
  }

  private estimateReleaseDate(commitDate: string): string {
    const date = new Date(commitDate);
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }
}

export const gitIntegrationService = new GitIntegrationService();