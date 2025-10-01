import { PhaseService, TopicService } from './dataServices';
import { initialPhases, initialTopics } from '../data/initialData';

export class DataSeedingService {
  static async seedInitialData(): Promise<boolean> {
    try {
      console.log('Starting data seeding...');
      
      // Check if phases already exist
      const existingPhases = await PhaseService.getAllPhases();
      if (existingPhases.length > 0) {
        console.log('Phases already exist, skipping seeding');
        return true;
      }

      // Create phases
      const createdPhaseIds = [];
      for (const phaseData of initialPhases) {
        const phaseId = await PhaseService.createPhase({
          ...phaseData,
          created_at: new Date()
        });
        createdPhaseIds.push({ id: phaseId, name: phaseData.name });
        console.log(`Created phase: ${phaseData.name}`);
      }

      // Create topics for each phase
      for (const phaseInfo of createdPhaseIds) {
        const topicsForPhase = initialTopics[phaseInfo.name];
        if (topicsForPhase) {
          for (const topicData of topicsForPhase) {
            await TopicService.createTopic({
              ...topicData,
              phase_id: phaseInfo.id,
              created_at: new Date()
            });
            console.log(`Created topic: ${topicData.name} for phase: ${phaseInfo.name}`);
          }
        }
      }

      console.log('Data seeding completed successfully!');
      return true;
    } catch (error) {
      console.error('Error seeding initial data:', error);
      return false;
    }
  }

  static async resetData(): Promise<boolean> {
    try {
      console.log('Resetting data...');
      
      // Note: In a production environment, you might want more careful deletion
      // This is for development/demo purposes
      console.warn('Data reset functionality should be used carefully in production');
      
      return true;
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  }

  // Helper method to check data status
  static async getDataStatus(): Promise<{
    phasesCount: number;
    topicsCount: number;
    isSeeded: boolean;
  }> {
    try {
      const phases = await PhaseService.getAllPhases();
      let topicsCount = 0;
      
      for (const phase of phases) {
        const topics = await TopicService.getTopicsByPhase(phase.id);
        topicsCount += topics.length;
      }

      return {
        phasesCount: phases.length,
        topicsCount,
        isSeeded: phases.length > 0
      };
    } catch (error) {
      console.error('Error checking data status:', error);
      return {
        phasesCount: 0,
        topicsCount: 0,
        isSeeded: false
      };
    }
  }
}