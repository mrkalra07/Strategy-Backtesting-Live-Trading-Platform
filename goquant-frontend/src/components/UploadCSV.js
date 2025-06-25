// src/components/UploadCSV.js
import React, { useState } from 'react';
import { Button, Typography, Box, Card, CardContent, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import Papa from 'papaparse';

const EXCHANGES = ['binance', 'bybit', 'coinbase', 'kraken'];
const MARKET_TYPES = ['spot', 'perp', 'futures', 'options'];

export default function UploadCSV({ onUploadSuccess, onMetaChange }) {
  const [files, setFiles] = useState([]);
  const [meta, setMeta] = useState({}); // { symbol: { exchange, market_type } }

  const handleChange = (e) => {
    setFiles(Array.from(e.target.files));
    // Pre-fill meta for new files
    const newMeta = { ...meta };
    Array.from(e.target.files).forEach(file => {
      const symbol = file.name.replace(/\.csv$/i, '');
      if (!newMeta[symbol]) {
        newMeta[symbol] = { exchange: EXCHANGES[0], market_type: MARKET_TYPES[0] };
      }
    });
    setMeta(newMeta);
  };

  const handleMetaChange = (symbol, field, value) => {
    setMeta(prev => {
      const updated = { ...prev, [symbol]: { ...prev[symbol], [field]: value } };
      if (onMetaChange) onMetaChange(updated, files);
      return updated;
    });
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
          // Normalize headers
          const required = ["timestamp", "open", "high", "low", "close", "volume"];
          const headerMap = {};
          if (results.meta && results.meta.fields) {
            results.meta.fields.forEach(h => {
              headerMap[h] = h.toLowerCase().trim();
            });
          }
          // Check for required columns
          const normalizedFields = Object.values(headerMap);
          const missing = required.filter(col => !normalizedFields.includes(col));
          if (missing.length) {
            alert(`File ${file.name} is missing required columns: ${missing.join(", ")}`);
            filesProcessed++;
            if (filesProcessed === files.length) {
              onUploadSuccess(symbolData);
            }
            return;
          }
          // Map each row using normalized headers
          const data = results.data.map(row => {
            const normRow = {};
            Object.entries(row).forEach(([k, v]) => {
              const normKey = k.toLowerCase().trim();
              normRow[normKey] = v;
            });
            return {
              timestamp: normRow.timestamp,
              open: +normRow.open,
              high: +normRow.high,
              low: +normRow.low,
              close: +normRow.close,
              volume: +normRow.volume,
            };
          });
          let symbol = file.name.replace(/\.csv$/i, '');
          if (!symbol || symbol in symbolData) {
            symbol = window.prompt(`Enter symbol for file ${file.name}:`, symbol || 'SYMBOL');
          }
          // Attach exchange and market_type
          symbolData[symbol] = {
            exchange: meta[symbol]?.exchange || EXCHANGES[0],
            market_type: meta[symbol]?.market_type || MARKET_TYPES[0],
            ohlcv: data
          };
          filesProcessed++;
          if (filesProcessed === files.length) {
            onUploadSuccess(symbolData);
          }
        },
        error: (err) => {
          alert(`Error parsing file ${file.name}: ${err}`);
          filesProcessed++;
          if (filesProcessed === files.length) {
            onUploadSuccess(symbolData);
          }
        }
      });
    });
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload OHLCV CSV(s)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
        {files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {files.map((file) => {
              const symbol = file.name.replace(/\.csv$/i, '');
              return (
                <Box key={symbol} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ minWidth: 120, fontWeight: 500 }}>{symbol}</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Exchange</InputLabel>
                    <Select
                      value={meta[symbol]?.exchange || EXCHANGES[0]}
                      label="Exchange"
                      onChange={e => handleMetaChange(symbol, 'exchange', e.target.value)}
                    >
                      {EXCHANGES.map(ex => <MenuItem key={ex} value={ex}>{ex}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Market Type</InputLabel>
                    <Select
                      value={meta[symbol]?.market_type || MARKET_TYPES[0]}
                      label="Market Type"
                      onChange={e => handleMetaChange(symbol, 'market_type', e.target.value)}
                    >
                      {MARKET_TYPES.map(mt => <MenuItem key={mt} value={mt}>{mt}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
