import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_BASE = 'http://localhost:3005/api';

function Statistics({ onError }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error) {
      onError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading statistics...
        </Typography>
      </Paper>
    );
  }

  if (!stats) {
    return (
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Unable to load statistics
        </Typography>
      </Paper>
    );
  }

  // Prepare chart data
  const ghostDistribution = stats.ghost_distribution
    ? Object.entries(stats.ghost_distribution).map(([type, count]) => ({
        type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
      }))
    : [];
  
  // Calculate percentages
  const totalEmployees = stats.total_employees || 0;
  const ghostCount = stats.ghost_employees || 0;
  const legitimateCount = stats.legitimate_employees || 0;
  const ghostPercentage = totalEmployees > 0 ? ((ghostCount / totalEmployees) * 100).toFixed(2) : 0;
  const monthlyCost = stats.ghost_salary_cost || 0;

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BarChartIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            System Statistics
          </Typography>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {totalEmployees.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Total Employees
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {ghostCount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Ghost Employees Detected
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {ghostPercentage}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {legitimateCount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Legitimate Employees
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {(100 - ghostPercentage).toFixed(2)}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>💰</Typography>
                <Typography variant="h5" fontWeight="bold">
                  K {(monthlyCost / 1000000).toFixed(2)}M
                </Typography>
                <Typography variant="body2">
                  Monthly Ghost Cost
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  K {(monthlyCost * 12 / 1000000).toFixed(2)}M annually
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Data Source Cards */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Data Sources
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <AccountBalanceIcon sx={{ fontSize: 32, color: '#667eea', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total_napsa_records?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    NAPSA Contribution Records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 32, color: '#4facfe', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total_nrc_records?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Home Affairs Death Registry
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <ReceiptIcon sx={{ fontSize: 32, color: '#43e97b', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total_bank_transactions?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bank Transaction Records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Ghost Distribution Chart */}
      {ghostDistribution.length > 0 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Employee Distribution by Type
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={ghostDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* About */}
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About GhostBuster
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          GhostBuster is an advanced ghost employee detection system designed for the Zambia Revenue Authority (ZRA).
          It uses multi-source data analysis to identify fraudulent employees in the Zambian government payroll.
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          Detection Methods:
        </Typography>
        <ul>
          <li>
            <Typography variant="body2" color="text.secondary">
              Cross-reference with NAPSA contributions database
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Verify against Home Affairs death registry
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Analyze bank withdrawal patterns across 10+ Zambian banks
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Detect duplicate NRC usage and identity theft
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Flag employees over retirement age (65+)
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Identify shell company transfers and suspicious withdrawal patterns
            </Typography>
          </li>
        </ul>
      </Paper>
    </Box>
  );
}

export default Statistics;
