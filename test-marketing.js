
import { marketingAutomation } from './server/marketing.js';
import { marketingAnalytics } from './server/analytics.js';

async function testMarketing() {
  try {
    console.log('Testing marketing automation...');
    await marketingAutomation.runAutomatedMarketing();
    
    console.log('Testing analytics...');
    await marketingAnalytics.generateDashboard();
    
    console.log('✅ Marketing system working correctly!');
  } catch (error) {
    console.error('❌ Marketing system error:', error);
  }
}

testMarketing();
