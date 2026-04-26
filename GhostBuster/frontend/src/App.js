import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import IndividualAnalysis from './components/IndividualAnalysis';
import BatchAnalysis from './components/BatchAnalysis';
import Results from './components/Results';
import Statistics from './components/Statistics';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleAnalysisComplete = (data) => {
    setResults(data);
    setCurrentTab(2); // Switch to results tab
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
  };

  const handleSuccess = (successMsg) => {
    setSuccess(successMsg);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          {/* Header */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              mb: 3,
              background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h3" component="h1">
                  GhostBuster
                </Typography>
                <Typography variant="subtitle1">
                  ZRA Ghost Employee Detection System
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Navigation Tabs */}
          <Paper elevation={3} sx={{ mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Tab label="Individual Analysis" />
              <Tab label="Batch Analysis" />
              <Tab label="Results" />
              <Tab label="Statistics" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box>
            {currentTab === 0 && (
              <IndividualAnalysis
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
                onSuccess={handleSuccess}
              />
            )}
            {currentTab === 1 && (
              <BatchAnalysis
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
                onSuccess={handleSuccess}
              />
            )}
            {currentTab === 2 && (
              <Results
                results={results}
                onError={handleError}
                onSuccess={handleSuccess}
              />
            )}
            {currentTab === 3 && (
              <Statistics
                onError={handleError}
              />
            )}
          </Box>

          {/* Footer */}
          <Paper
            elevation={1}
            sx={{
              mt: 4,
              p: 2,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              GhostBuster v1.0 | Built for ZRA Hackathon | Zambia Revenue Authority
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
