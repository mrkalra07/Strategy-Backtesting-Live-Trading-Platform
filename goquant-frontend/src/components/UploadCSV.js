import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import Papa from 'papaparse';

const UploadCSV = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);

  const handleChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map(row => ({
          timestamp: row.timestamp,
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseFloat(row.volume)
        }));

        onUploadSuccess(data);
      },
      error: (err) => {
        console.error('CSV Parsing Error:', err);
      }
    });
  };

  return (
    <Box display="flex" alignItems="center" gap={2} mt={2}>
      <Button variant="outlined" component="label">
        Choose CSV
        <input type="file" accept=".csv" hidden onChange={handleChange} />
      </Button>
      <Typography variant="body1">
        {file ? file.name : 'No file selected'}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleUpload} disabled={!file}>
        Upload
      </Button>
    </Box>
  );
};

export default UploadCSV;
