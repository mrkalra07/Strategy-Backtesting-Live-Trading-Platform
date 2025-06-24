// src/components/UploadCSV.js
import React, { useState } from 'react';
import { Button, Typography, Box, Card, CardContent } from '@mui/material';
import Papa from 'papaparse';

export default function UploadCSV({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const handleChange = (e) => setFile(e.target.files[0]);
  const handleUpload = () => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map(row => ({
          timestamp: row.timestamp,
          open: +row.open,
          high: +row.high,
          low: +row.low,
          close: +row.close,
          volume: +row.volume,
        }));
        onUploadSuccess(data);
      },
    });
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload OHLCV CSV
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" component="label">
            Select CSV
            <input type="file" accept=".csv" hidden onChange={handleChange} />
          </Button>
          <Typography>{file?.name || 'No file selected'}</Typography>
          <Button
            variant="contained"
            disabled={!file}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
