const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:4001'], credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

let reports = [
  {
    id: 1, caseId: 'WP-001', title: 'Tax Evasion at ABC Mining', company: 'ABC Mining Ltd',
    category: 'Tax Evasion', priority: 'High', status: 'Under Investigation',
    reportedDate: '2025-10-15', reporter: 'Anonymous', assignedTo: 'John Doe',
    description: 'Company suspected of underreporting revenue.',
    evidence: ['Document scans', 'Financial records']
  },
  {
    id: 2, caseId: 'WP-002', title: 'Phantom Employees at XYZ Traders', company: 'XYZ Traders',
    category: 'Payroll Fraud', priority: 'Critical', status: 'Open',
    reportedDate: '2025-10-14', reporter: 'Anonymous', assignedTo: 'Mary Johnson',
    description: 'Several employees on payroll do not exist.',
    evidence: ['Payroll documents']
  }
];

app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.get('/api/reports', (req, res) => res.json({ total: reports.length, reports }));
app.get('/api/reports/:caseId', (req, res) => {
  const report = reports.find(r => r.caseId === req.params.caseId);
  if (!report) return res.status(404).json({ error: 'Not found' });
  res.json(report);
});

app.post('/api/reports', (req, res) => {
  const newId = reports.length + 1;
  const caseId = 'WP-' + String(newId).padStart(3, '0');
  const newReport = { id: newId, caseId, status: 'Open', reportedDate: new Date().toISOString().split('T')[0], ...req.body };
  reports.unshift(newReport);
  res.status(201).json({ success: true, caseId });
});

app.patch('/api/reports/:caseId/status', (req, res) => {
  const report = reports.find(r => r.caseId === req.params.caseId);
  if (!report) return res.status(404).json({ error: 'Not found' });
  report.status = req.body.status;
  res.json({ success: true, caseId: report.caseId, status: report.status });
});

app.listen(PORT, () => console.log('WhistlePro Backend on port', PORT));
