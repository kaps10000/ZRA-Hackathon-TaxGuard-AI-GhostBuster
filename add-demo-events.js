const axios = require('axios');

const BLOCKCHAIN_API = 'http://localhost:3001/api';

// Sample events for each team module
const demoEvents = [
  // GhostBuster Events
  {
    eventType: 'auditFlag',
    anonymizedUserId: 'ghostbuster-detection-001',
    hashOfPayload: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
    notes: 'GhostBuster: Phantom employee detected - No biometric records found',
    module: 'GhostBuster'
  },
  {
    eventType: 'auditFlag', 
    anonymizedUserId: 'ghostbuster-detection-002',
    hashOfPayload: 'b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
    notes: 'GhostBuster: Ghost company flagged - Multiple employees same address',
    module: 'GhostBuster'
  },
  
  // WhistlePro Events
  {
    eventType: 'whistleblower',
    anonymizedUserId: 'whistlepro-report-001', 
    hashOfPayload: 'c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2',
    notes: 'WhistlePro: Anonymous tax evasion report - Case WP-2025-001',
    module: 'WhistlePro'
  },
  {
    eventType: 'whistleblower',
    anonymizedUserId: 'whistlepro-report-002',
    hashOfPayload: 'd4e5f6789012345678901234567890123456789012345678901234567890a1b2c3', 
    notes: 'WhistlePro: Corruption allegation submitted - Case WP-2025-002',
    module: 'WhistlePro'
  },
  
  // AI Risk Events
  {
    eventType: 'compliance',
    anonymizedUserId: 'ai-risk-assessment-001',
    hashOfPayload: 'e5f6789012345678901234567890123456789012345678901234567890a1b2c3d4',
    notes: 'AI Risk: High-risk taxpayer identified - Risk score: 87%',
    module: 'AI Risk'
  },
  {
    eventType: 'compliance',
    anonymizedUserId: 'ai-risk-assessment-002', 
    hashOfPayload: 'f6789012345678901234567890123456789012345678901234567890a1b2c3d4e5',
    notes: 'AI Risk: Compliance trend analysis - Improving pattern detected',
    module: 'AI Risk'
  },
  
  // Predictive Analytics Events
  {
    eventType: 'adminChange',
    anonymizedUserId: 'predictive-forecast-001',
    hashOfPayload: '789012345678901234567890123456789012345678901234567890a1b2c3d4e5f6',
    notes: 'Predictive: Q1 2026 revenue forecast - ZMW 45M predicted',
    module: 'Predictive'
  },
  {
    eventType: 'adminChange', 
    anonymizedUserId: 'predictive-forecast-002',
    hashOfPayload: '89012345678901234567890123456789012345678901234567890a1b2c3d4e5f67',
    notes: 'Predictive: Compliance rate forecast - 12% improvement expected',
    module: 'Predictive'
  }
];

async function addDemoEvents() {
  console.log('🚀 Adding demo events for team modules...\n');
  
  for (let i = 0; i < demoEvents.length; i++) {
    const event = demoEvents[i];
    try {
      const response = await axios.post(`${BLOCKCHAIN_API}/events`, event);
      console.log(`✅ ${event.module}: ${event.notes.substring(0, 50)}...`);
      
      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Failed to add ${event.module} event:`, error.message);
    }
  }
  
  console.log('\n🎉 Demo events added! Check your dashboard at http://localhost:5173');
  
  // Show current stats
  try {
    const statsResponse = await axios.get(`${BLOCKCHAIN_API}/dashboard-feed/summary`);
    const stats = statsResponse.data.summary;
    
    console.log('\n📊 Current Blockchain Stats:');
    console.log(`   Total Events: ${stats.blockchain.totalEvents}`);
    console.log(`   Total Blocks: ${stats.blockchain.totalBlocks}`);
    console.log(`   Chain Valid: ${stats.blockchain.chainValid}`);
    console.log('\n🔗 Module Activity:');
    Object.entries(stats.modules).forEach(([module, count]) => {
      console.log(`   ${module}: ${count} events`);
    });
  } catch (error) {
    console.log('Could not fetch stats:', error.message);
  }
}

addDemoEvents().catch(console.error);
