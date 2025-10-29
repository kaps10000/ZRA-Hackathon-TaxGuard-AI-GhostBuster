const axios = require('axios');

const API_URL = 'http://localhost:4000/api/reports';

const mockReports = [
  {
    category: 'tax_evasion',
    title: 'Construction Company Underreporting Revenue',
    description: 'ABC Construction Ltd has been operating for 5 years but consistently reports minimal profits despite handling multiple government contracts worth millions. They submit fabricated financial statements showing losses while their operations clearly indicate substantial revenue. Multiple employees have confirmed off-the-books cash payments.',
    priority: 'high',
    evidence: {
      financial_details: {
        estimated_amount: 2500000,
        currency: 'ZMW',
        frequency: 'yearly'
      },
      documents: ['contract_invoice_001.pdf', 'bank_statement_analysis.pdf']
    },
    subjects: {
      organizations: [{
        name: 'ABC Construction Ltd',
        tpin: '1002345678',
        pacra_number: 'CR-2018-12345',
        address: 'Plot 123, Industrial Area, Lusaka'
      }]
    },
    location: {
      province: 'Lusaka',
      district: 'Lusaka',
      area: 'Industrial Area'
    },
    timeline: {
      ongoing: true,
      discovery_date: new Date('2024-08-15')
    }
  },
  {
    category: 'phantom_employees',
    title: 'Ghost Workers in Ministry Payroll',
    description: 'The payroll department at a government ministry has been processing salaries for at least 15 employees who do not physically report to work. These individuals names appear on attendance registers but are never seen at the workplace. Monthly salary payments totaling over K75,000 are being disbursed to these ghost workers.',
    priority: 'critical',
    evidence: {
      financial_details: {
        estimated_amount: 900000,
        currency: 'ZMW',
        frequency: 'yearly'
      },
      witnesses: [{
        description: 'Current ministry employee who noticed discrepancies in attendance vs payroll'
      }]
    },
    subjects: {
      individuals: [{
        position: 'Payroll Manager',
        organization: 'Government Ministry'
      }]
    },
    location: {
      province: 'Lusaka',
      district: 'Lusaka'
    },
    timeline: {
      ongoing: true,
      incident_date: new Date('2023-01-01')
    }
  },
  {
    category: 'ghost_companies',
    title: 'Shell Company Used for Tax Fraud',
    description: 'XYZ Trading Ltd is registered with ZRA and files VAT returns claiming large input credits, but the company has no physical premises, no employees, and no legitimate business operations. The TPIN is being used to generate fake invoices for other businesses to claim fraudulent VAT refunds.',
    priority: 'high',
    evidence: {
      financial_details: {
        estimated_amount: 450000,
        currency: 'ZMW',
        frequency: 'ongoing'
      },
      documents: ['fake_invoice_samples.pdf', 'company_search_results.pdf']
    },
    subjects: {
      organizations: [{
        name: 'XYZ Trading Ltd',
        tpin: '1009876543',
        address: 'No physical address - PO Box only'
      }]
    },
    location: {
      province: 'Copperbelt',
      district: 'Kitwe'
    },
    timeline: {
      ongoing: true,
      discovery_date: new Date('2024-09-20')
    }
  },
  {
    category: 'corruption',
    title: 'Tax Officer Soliciting Bribes',
    description: 'A senior tax officer at ZRA Ndola office has been demanding bribes from businesses during tax audits. Multiple business owners report being asked for payments ranging from K5,000 to K50,000 to avoid penalties or to have their tax assessments reduced. The officer threatens extended audits and penalties for non-compliance.',
    priority: 'critical',
    evidence: {
      financial_details: {
        estimated_amount: 150000,
        currency: 'ZMW',
        frequency: 'ongoing'
      },
      witnesses: [{
        description: 'Business owner who paid bribe and kept records'
      }, {
        description: 'Accountant who witnessed the solicitation'
      }]
    },
    subjects: {
      individuals: [{
        position: 'Senior Tax Officer',
        organization: 'ZRA Ndola Branch'
      }]
    },
    location: {
      province: 'Copperbelt',
      district: 'Ndola',
      specific_address: 'ZRA Offices, Broadway'
    },
    timeline: {
      ongoing: true,
      incident_date: new Date('2024-06-01')
    }
  },
  {
    category: 'fraud',
    title: 'VAT Refund Fraud Scheme',
    description: 'A network of businesses is collaborating to submit fraudulent VAT refund claims. They create fake purchase invoices between themselves, inflate input VAT claims, and then apply for refunds. The businesses are all owned by the same group but operate under different names to avoid detection.',
    priority: 'high',
    evidence: {
      financial_details: {
        estimated_amount: 1200000,
        currency: 'ZMW',
        frequency: 'monthly'
      },
      documents: ['invoice_pattern_analysis.pdf', 'ownership_structure.pdf']
    },
    subjects: {
      organizations: [{
        name: 'FastTrade Ltd',
        tpin: '1001234567'
      }, {
        name: 'QuickSupply Ltd',
        tpin: '1007654321'
      }]
    },
    location: {
      province: 'Lusaka',
      district: 'Lusaka',
      area: 'Cairo Road'
    },
    timeline: {
      ongoing: true,
      incident_date: new Date('2024-03-01')
    }
  },
  {
    category: 'money_laundering',
    title: 'Cash Business Hiding Income',
    description: 'A chain of retail shops is suspected of money laundering. They report very low sales volumes but consistently purchase large quantities of inventory from suppliers. Staff report that most transactions are cash-based and not recorded. The business may be used to launder proceeds from other illegal activities.',
    priority: 'medium',
    evidence: {
      financial_details: {
        estimated_amount: 800000,
        currency: 'ZMW',
        frequency: 'ongoing'
      }
    },
    subjects: {
      organizations: [{
        name: 'Mega Retail Shops',
        tpin: '1005555555',
        address: 'Multiple locations in Lusaka and Kitwe'
      }]
    },
    location: {
      province: 'Lusaka',
      district: 'Lusaka',
      area: 'Kamwala'
    },
    timeline: {
      ongoing: true,
      discovery_date: new Date('2024-07-10')
    }
  },
  {
    category: 'tax_evasion',
    title: 'Import Undervaluation Scheme',
    description: 'An importing company is consistently undervaluing goods at customs to reduce import duties and VAT. They submit invoices showing much lower values than market prices. The company then sells the goods at normal market rates without declaring the actual revenue, avoiding both customs duties and income tax.',
    priority: 'high',
    evidence: {
      financial_details: {
        estimated_amount: 650000,
        currency: 'ZMW',
        frequency: 'yearly'
      },
      documents: ['customs_declaration_comparison.pdf', 'market_price_analysis.pdf']
    },
    subjects: {
      organizations: [{
        name: 'Global Imports Ltd',
        tpin: '1003456789',
        address: 'Chinika Industrial Area, Lusaka'
      }]
    },
    location: {
      province: 'Lusaka',
      district: 'Lusaka'
    },
    timeline: {
      ongoing: true,
      incident_date: new Date('2023-11-01')
    }
  },
  {
    category: 'bribery',
    title: 'Customs Officer Facilitating Smuggling',
    description: 'A customs officer at Chirundu border post is allegedly receiving bribes to allow under-declared goods and contraband to pass through customs without proper inspection. Multiple truck drivers have confirmed paying bribes of K500 to K2000 per trip to avoid inspections.',
    priority: 'critical',
    evidence: {
      financial_details: {
        estimated_amount: 300000,
        currency: 'ZMW',
        frequency: 'yearly'
      },
      witnesses: [{
        description: 'Truck driver who regularly crosses the border'
      }]
    },
    subjects: {
      individuals: [{
        position: 'Customs Officer',
        organization: 'ZRA Chirundu Border Post'
      }]
    },
    location: {
      province: 'Southern',
      district: 'Chirundu',
      specific_address: 'Chirundu Border Post'
    },
    timeline: {
      ongoing: true,
      incident_date: new Date('2024-01-15')
    }
  }
];

async function createMockReports() {
  console.log('============================================');
  console.log('Creating Mock Whistleblower Reports...');
  console.log('============================================\n');

  const results = [];

  for (let i = 0; i < mockReports.length; i++) {
    const report = mockReports[i];
    try {
      console.log(`[${i + 1}/${mockReports.length}] Creating: ${report.title}`);

      const response = await axios.post(API_URL, report);

      if (response.data.success) {
        results.push({
          success: true,
          case_id: response.data.data.case_id,
          title: report.title,
          category: report.category,
          priority: report.priority
        });
        console.log(`✅ Created successfully - Case ID: ${response.data.data.case_id}\n`);
      }
    } catch (error) {
      console.error(`❌ Failed to create report: ${error.message}`);
      if (error.response) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      results.push({
        success: false,
        title: report.title,
        error: error.message
      });
      console.log();
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n============================================');
  console.log('Summary');
  console.log('============================================');
  console.log(`Total reports attempted: ${mockReports.length}`);
  console.log(`Successfully created: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  console.log('\n📋 Created Case IDs:');
  results.filter(r => r.success).forEach(r => {
    console.log(`   ${r.case_id} - ${r.title} (${r.category}, ${r.priority})`);
  });

  console.log('\n============================================');
}

createMockReports().catch(console.error);
