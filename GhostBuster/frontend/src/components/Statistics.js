import React, { useState, useEffect, useCallback } from 'react';
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

const API_BASE = 'http://localhost:3006/api';

function Statistics({ onError }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error) {
      onError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

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
        type: type.replace('_', ' '),
        count,
      }))
    : [];

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
                  {stats.total_employees?.toLocaleString()}
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
                <AccountBalanceIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.total_napsa_records?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  NAPSA Records
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.total_nrc_records?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  NRC Registry Records
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <ReceiptIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {stats.total_bank_transactions?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Bank Transactions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
