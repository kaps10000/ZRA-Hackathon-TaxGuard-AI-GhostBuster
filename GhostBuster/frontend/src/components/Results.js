import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';
import { saveAs } from 'file-saver';

const API_BASE = 'http://localhost:3006/api';

const RISK_COLORS = {
  CRITICAL: '#d32f2f',
  HIGH: '#f57c00',
  MEDIUM: '#ffa726',
  LOW: '#66bb6a',
};

const SEVERITY_ICONS = {
  CRITICAL: <ErrorIcon color="error" />,
  HIGH: <WarningIcon color="warning" />,
  MEDIUM: <InfoIcon color="info" />,
  LOW: <CheckCircleIcon color="success" />,
};

function Results({ results, onError, onSuccess }) {
  const [expanded, setExpanded] = useState(false);

  if (!results) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No analysis results available. Please run an analysis first.
        </Typography>
      </Paper>
    );
  }

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const isBatchResult = results.summary !== undefined;
  const employees = isBatchResult ? results.results : [results];
  const summary = isBatchResult ? results.summary : null;

  const exportCSV = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/export/csv`,
        { results: employees },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv' });
      saveAs(blob, `ghostbuster_results_${new Date().toISOString().split('T')[0]}.csv`);
      onSuccess('Results exported to CSV');
    } catch (error) {
      onError('Failed to export CSV');
    }
  };

  const exportJSON = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/export/detailed`,
        { results: employees },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/json' });
      saveAs(blob, `ghostbuster_detailed_${new Date().toISOString().split('T')[0]}.json`);
      onSuccess('Detailed results exported to JSON');
    } catch (error) {
      onError('Failed to export JSON');
    }
  };

  // Prepare chart data
  const riskLevelData = summary
    ? [
        { name: 'Critical', value: summary.critical, color: RISK_COLORS.CRITICAL },
        { name: 'High', value: summary.high, color: RISK_COLORS.HIGH },
        { name: 'Medium', value: summary.medium, color: RISK_COLORS.MEDIUM },
        { name: 'Low', value: summary.low, color: RISK_COLORS.LOW },
      ]
    : [];

  return (
    <Box>
      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ backgroundColor: '#f3f4f6' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {summary.total_analyzed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Analyzed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ backgroundColor: '#fee2e2' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" color="error">
                  {summary.critical}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Risk
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ backgroundColor: '#fef3c7' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {summary.confirmed_ghosts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmed Ghosts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ backgroundColor: '#ffedd5' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" color="warning.dark">
                  {summary.likely_ghosts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Likely Ghosts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {summary && riskLevelData.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risk Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskLevelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Export Buttons */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Export Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportJSON}
            >
              Export Detailed JSON
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Individual Results */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Results ({employees.length} {employees.length === 1 ? 'Employee' : 'Employees'})
        </Typography>

        {employees.map((employee, index) => (
          <Accordion
            key={index}
            expanded={expanded === index}
            onChange={handleAccordionChange(index)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {employee.full_name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    NRC: {employee.nrc}
                  </Typography>
                </Box>
                <Chip
                  label={employee.risk_level}
                  color={
                    employee.risk_level === 'CRITICAL'
                      ? 'error'
                      : employee.risk_level === 'HIGH'
                      ? 'warning'
                      : employee.risk_level === 'MEDIUM'
                      ? 'info'
                      : 'success'
                  }
                  size="small"
                />
                <Chip
                  label={employee.classification}
                  variant="outlined"
                  size="small"
                />
                <Typography variant="h6" fontWeight="bold">
                  {(employee.risk_score * 100).toFixed(0)}%
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Basic Info */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Employee Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            NRC:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">{employee.nrc}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Age:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">{employee.age || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Monthly Salary:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            K{employee.salary?.toLocaleString() || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Risk Score:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold">
                            {(employee.risk_score * 100).toFixed(1)}% ({employee.confidence * 100}% confidence)
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Financial Impact */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Financial Impact
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Monthly Salary:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            K{employee.financial_impact?.monthly_salary?.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Months Employed:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {employee.financial_impact?.employment_months}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Paid:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" fontWeight="bold" color="error">
                            K{employee.financial_impact?.total_paid?.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Evidence */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Evidence ({employee.evidence?.length || 0} findings)
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {employee.evidence && employee.evidence.length > 0 ? (
                        <List>
                          {employee.evidence.map((ev, idx) => (
                            <ListItem key={idx} alignItems="flex-start">
                              <Box sx={{ mr: 2 }}>{SEVERITY_ICONS[ev.severity]}</Box>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2">{ev.finding}</Typography>
                                    <Chip label={ev.severity} size="small" color={
                                      ev.severity === 'CRITICAL' ? 'error' :
                                      ev.severity === 'HIGH' ? 'warning' :
                                      ev.severity === 'MEDIUM' ? 'info' : 'default'
                                    } />
                                    <Chip label={ev.evidence_strength} size="small" variant="outlined" />
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {ev.details}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                      Source: {ev.source}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="success">No suspicious activity detected</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recommendations */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Recommendations
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <List>
                        {employee.recommendations?.map((rec, idx) => (
                          <ListItem key={idx}>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
}

export default Results;
