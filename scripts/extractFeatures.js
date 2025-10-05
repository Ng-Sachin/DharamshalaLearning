#!/usr/bin/env node

/**
 * Build-time Feature Extraction Script
 * 
 * This script runs during deployment to extract feature information
 * from Git commit history and generate a features manifest.
 * 
 * Usage:
 * - Add to package.json scripts: "prebuild": "node scripts/extractFeatures.js"
 * - Or run manually: node scripts/extractFeatures.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentFeatureExtractor {
  constructor() {
    this.featuresFile = path.join(__dirname, '../public/features.json');
    this.featureKeywords = [
      'feat:', 'feature:', 'add:', 'new:', 'implement:', 'create:',
      'coming soon', 'wip:', 'todo:', 'placeholder'
    ];
    this.completionKeywords = [
      'complete:', 'finish:', 'done:', 'ready:', 'deploy:', 'release:'
    ];
  }

  /**
   * Main extraction process
   */
  async extract() {
    console.log('🔍 Extracting features from Git history...');
    
    try {
      const commits = this.getRecentCommits(100); // Last 100 commits
      const features = this.parseCommitsForFeatures(commits);
      const manifest = this.generateManifest(features);
      
      this.writeManifest(manifest);
      this.logSummary(manifest);
      
    } catch (error) {
      console.error('❌ Feature extraction failed:', error);
      process.exit(1);
    }
  }

  /**
   * Get recent Git commits
   */
  getRecentCommits(limit = 50) {
    try {
      const gitCommand = `git log --oneline --format="%H|%s|%ai|%an" -${limit}`;
      const output = execSync(gitCommand, { encoding: 'utf8' });
      
      return output.trim().split('\n').map(line => {
        const [hash, message, date, author] = line.split('|');
        return { hash, message, date, author };
      });
    } catch (error) {
      console.warn('⚠️  Git not available, using fallback data');
      return this.getFallbackCommits();
    }
  }

  /**
   * Parse commits to extract feature information
   */
  parseCommitsForFeatures(commits) {
    const features = [];
    const seenFeatures = new Set();

    commits.forEach(commit => {
      const commitFeatures = this.extractFeaturesFromCommit(commit);
      
      commitFeatures.forEach(feature => {
        // Avoid duplicates based on title
        const featureKey = feature.title.toLowerCase().replace(/\s+/g, '-');
        if (!seenFeatures.has(featureKey)) {
          seenFeatures.add(featureKey);
          features.push(feature);
        }
      });
    });

    return features;
  }

  /**
   * Extract features from a single commit
   */
  extractFeaturesFromCommit(commit) {
    const features = [];
    const message = commit.message.toLowerCase();

    // Check if this is a feature-related commit
    const isFeatureCommit = this.featureKeywords.some(keyword => 
      message.includes(keyword)
    );

    if (isFeatureCommit) {
      const feature = {
        id: `feature-${commit.hash.substring(0, 8)}`,
        title: this.extractTitle(commit.message),
        description: this.extractDescription(commit.message),
        status: this.determineStatus(commit.message),
        dateAdded: commit.date.split(' ')[0], // Extract date part
        commitHash: commit.hash,
        author: commit.author
      };

      // Add estimated release for coming soon features
      if (feature.status === 'coming-soon') {
        feature.estimatedRelease = this.estimateReleaseDate(feature.dateAdded);
      }

      features.push(feature);
    }

    return features;
  }

  /**
   * Extract clean title from commit message
   */
  extractTitle(message) {
    let title = message
      .split('\n')[0] // First line only
      .replace(/^(feat|feature|add|new|implement|create):\s*/i, '')
      .replace(/coming soon\s*-\s*/i, '')
      .replace(/wip:\s*/i, '')
      .replace(/todo:\s*/i, '')
      .trim();

    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  /**
   * Extract description from commit body
   */
  extractDescription(message) {
    const lines = message.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return lines.slice(1).join(' ').trim();
    }
    return this.extractTitle(message);
  }

  /**
   * Determine feature status from commit message
   */
  determineStatus(message) {
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

  /**
   * Estimate release date (2 weeks from commit date)
   */
  estimateReleaseDate(commitDate) {
    const date = new Date(commitDate);
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate the final manifest
   */
  generateManifest(features) {
    const now = new Date().toISOString();
    
    return {
      generatedAt: now,
      version: process.env.npm_package_version || '1.0.0',
      features: {
        all: features,
        released: features.filter(f => f.status === 'released'),
        comingSoon: features.filter(f => f.status === 'coming-soon'),
        inDevelopment: features.filter(f => f.status === 'in-development'),
        planned: features.filter(f => f.status === 'planned')
      },
      pathMappings: {
        '/goals': features.some(f => 
          f.title.toLowerCase().includes('goal') || 
          f.title.toLowerCase().includes('reflection')
        ) ? 'coming-soon' : 'available',
        '/journey': features.some(f => 
          f.title.toLowerCase().includes('journey') || 
          f.title.toLowerCase().includes('timeline')
        ) ? 'coming-soon' : 'available'
      }
    };
  }

  /**
   * Write manifest to file
   */
  writeManifest(manifest) {
    // Ensure public directory exists
    const publicDir = path.dirname(this.featuresFile);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(this.featuresFile, JSON.stringify(manifest, null, 2));
    console.log(`✅ Features manifest written to ${this.featuresFile}`);
  }

  /**
   * Log extraction summary
   */
  logSummary(manifest) {
    const { features } = manifest;
    
    console.log('\n📊 Feature Extraction Summary:');
    console.log(`   Total Features: ${features.all.length}`);
    console.log(`   Released: ${features.released.length}`);
    console.log(`   Coming Soon: ${features.comingSoon.length}`);
    console.log(`   In Development: ${features.inDevelopment.length}`);
    console.log(`   Planned: ${features.planned.length}`);
    
    if (features.comingSoon.length > 0) {
      console.log('\n🚧 Coming Soon Features:');
      features.comingSoon.forEach(feature => {
        console.log(`   - ${feature.title} (Est: ${feature.estimatedRelease})`);
      });
    }
  }

  /**
   * Fallback commits when Git is not available
   */
  getFallbackCommits() {
    return [
      {
        hash: 'a1b2c3d4e5f6',
        message: 'feat: House-based color theming\nAdded personalized colors for different houses',
        date: '2025-10-05 10:30:00 +0000',
        author: 'Developer'
      },
      {
        hash: 'b2c3d4e5f6g7',
        message: 'feat: Coming soon - Goals & Reflections system\nStudent goal setting and reflection tracking',
        date: '2025-10-04 14:15:00 +0000',
        author: 'Developer'
      }
    ];
  }
}

// Run if called directly
if (require.main === module) {
  const extractor = new DeploymentFeatureExtractor();
  extractor.extract();
}

module.exports = DeploymentFeatureExtractor;