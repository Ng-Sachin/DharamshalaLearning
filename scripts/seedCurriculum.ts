

// Trigger script to seed curriculum phases and topics to Firestore
// Usage: npx ts-node scripts/seedCurriculum.ts

const { DataSeedingService } = require('../src/services/dataSeedingService');

(async () => {
  try {
    console.log('Seeding curriculum data to Firestore...');
    const success = await DataSeedingService.seedInitialData();
    if (success) {
      console.log('✅ Curriculum seeding complete!');
    } else {
      console.error('❌ Curriculum seeding failed.');
    }
  } catch (err) {
    console.error('❌ Error during curriculum seeding:', err);
  }
})();
