import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import axios from 'axios';

const API_BASE = 'http://localhost:5002/api';

function IndividualAnalysis({ onAnalysisComplete, onError, onSuccess, setLoading }) {
  const [nrc, setNrc] = useState('');
  const [fullName, setFullName] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentStart, setEmploymentStart] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sampleData, setSampleData] = useState(null);

  const handleAnalyze = async () => {
    if (!nrc.trim()) {
      onError('NRC is required');
      return;
    }

    setAnalyzing(true);
    setLoading(true);

    try {
      const payload = {
        nrc: nrc.trim(),
      };

      if (fullName.trim()) payload.full_name = fullName.trim();
      if (salary) payload.salary = parseFloat(salary);
      if (employmentStart) payload.employment_start = employmentStart;

      const response = await axios.post(`${API_BASE}/analyze/individual`, payload);

      if (response.data.error) {
        onError(response.data.error);
      } else {
        onAnalysisComplete(response.data);
        onSuccess('Analysis completed successfully');
      }
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to analyze employee');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sample`);
      setSampleData(response.data);
      onSuccess('Sample data loaded');
    } catch (error) {
      onError('Failed to load sample data');
    }
  };

  const fillSample = (sample) => {
    setNrc(sample.nrc);
    setFullName(sample.full_name);
    setSalary(sample.salary.toString());
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonSearchIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            Individual Employee Analysis
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter employee details to analyze for ghost worker indicators. NRC is required;
          other fields are optional and will be looked up from the database.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="NRC Number *"
              placeholder="123456/78/9"
              value={nrc}
              onChange={(e) => setNrc(e.target.value)}
              variant="outlined"
              helperText="Zambian National Registration Card number"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name (Optional)"
              placeholder="John Banda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Monthly Salary (Optional)"
              placeholder="10000"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              variant="outlined"
              helperText="Salary in ZMW (Zambian Kwacha)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employment Start Date (Optional)"
              type="date"
              value={employmentStart}
              onChange={(e) => setEmploymentStart(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={loadSampleData}
              >
                Load Samples
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Employee'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Sample Data Cards */}
      {sampleData && (
        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sample Test Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click on any sample to auto-fill the form
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(sampleData).map(([type, samples]) => (
              <Grid item xs={12} key={type}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'capitalize' }}>
                  {type.replace('_', ' ')}
                </Typography>
                <Grid container spacing={2}>
                  {samples.map((sample, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s',
                          },
                        }}
                        onClick={() => fillSample(sample)}
                      >
                        <CardContent>
                          <Typography variant="body2" fontWeight="bold">
                            {sample.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            NRC: {sample.nrc}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Salary: K{sample.salary.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default IndividualAnalysis;
