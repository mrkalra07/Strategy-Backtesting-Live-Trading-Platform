// src/components/UploadCSV.js
import React, { useState } from 'react';
import { Button, Typography, Box, Card, CardContent } from '@mui/material';
import Papa from 'papaparse';

export default function UploadCSV({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = () => {
    if (!files.length) return;
    const symbolData = {};
    let filesProcessed = 0;

    files.forEach((file) => {
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
          // Try to extract symbol from filename (e.g., BTC-USDT.csv)
          let symbol = file.name.replace(/\.csv$/i, '');
          if (!symbol || symbol in symbolData) {
            symbol = window.prompt(`Enter symbol for file ${file.name}:`, symbol || 'SYMBOL');
          }
          symbolData[symbol] = data;
          filesProcessed++;
          if (filesProcessed === files.length) {
            onUploadSuccess(symbolData);
          }
        },
      });
    });
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload OHLCV CSV(s)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" component="label">
            Select CSV(s)
            <input type="file" accept=".csv" hidden multiple onChange={handleChange} />
          </Button>
          <Typography>
            {files.length ? files.map(f => f.name).join(', ') : 'No file(s) selected'}
          </Typography>
          <Button
            variant="contained"
            disabled={!files.length}
            onClick={handleUpload}
          >
            Upload
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
