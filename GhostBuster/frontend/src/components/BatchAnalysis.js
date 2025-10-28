import React, { useState, useCallback } from 'react';
import {
  Paper,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_BASE = 'http://localhost:3006/api';

function BatchAnalysis({ onAnalysisComplete, onError, onSuccess, setLoading }) {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) {
      onError('Please upload a file first');
      return;
    }

    setAnalyzing(true);
    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/analyze/batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      if (response.data.error) {
        onError(response.data.error);
      } else {
        onAnalysisComplete(response.data);
        onSuccess(`Analyzed ${response.data.summary.total_analyzed} employees successfully`);
      }
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to analyze batch');
    } finally {
      setAnalyzing(false);
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'nrc,full_name,salary,employment_start\n123456/78/9,John Banda,10000,2018-01-15\n987654/32/1,Mary Phiri,12000,2019-03-20';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghostbuster_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CloudUploadIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" component="h2">
            Batch Employee Analysis
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload a CSV or Excel file containing employee NRC numbers for bulk analysis.
          The file must contain an "nrc" column. Other columns (full_name, salary, employment_start) are optional.
        </Typography>

        {/* File Upload Dropzone */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            mb: 3,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <UploadFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          {isDragActive ? (
            <Typography variant="h6">Drop the file here...</Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Drag & drop a file here, or click to browse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: CSV, XLS, XLSX (Max 1000 records)
              </Typography>
            </>
          )}
        </Box>

        {/* Selected File */}
        {file && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'success.lighter' }}>
            <List>
              <ListItem>
                <ListItemText
                  primary={file.name}
                  secondary={`Size: ${(file.size / 1024).toFixed(2)} KB | Type: ${file.type}`}
                />
              </ListItem>
            </List>
          </Paper>
        )}

        {/* Progress Bar */}
        {analyzing && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Analyzing employees... {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={downloadTemplate}>
            Download Template
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={
              analyzing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CloudUploadIcon />
              )
            }
            onClick={handleAnalyze}
            disabled={!file || analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Analyze Batch'}
          </Button>
        </Box>
      </Paper>

      {/* Instructions */}
      <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          CSV/Excel File Format
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your file should have the following columns:
        </Typography>
        <List sx={{ pl: 2 }}>
          <ListItem>
            <ListItemText
              primary="nrc (required)"
              secondary="National Registration Card number (e.g., 123456/78/9)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="full_name (optional)"
              secondary="Employee full name"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="salary (optional)"
              secondary="Monthly salary in ZMW"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="employment_start (optional)"
              secondary="Employment start date (YYYY-MM-DD format)"
            />
          </ListItem>
        </List>
        <Typography variant="body2" color="text.secondary">
          Download the template above for a properly formatted example.
        </Typography>
      </Paper>
    </Box>
  );
}

export default BatchAnalysis;
