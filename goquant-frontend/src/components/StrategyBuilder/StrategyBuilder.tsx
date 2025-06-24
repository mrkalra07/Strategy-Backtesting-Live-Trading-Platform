// src/components/StrategyBuilder/StrategyBuilder.tsx
import React, { useRef } from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import axios from 'axios';

// === Types ===
interface NodeData {
  id: string;
  type: string;
  data: {
    label?: string;
    action?: string;
  };
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface FlowData {
  nodes: NodeData[];
  edges: EdgeData[];
}

interface StrategyBuilderProps {
  uploadedOHLCVData: any[];
  onResult: (result: any) => void;
  sl?: number;
  tp?: number;
  fees?: number;
  slippage?: number;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  uploadedOHLCVData,
  onResult,
  sl = 0,
  tp = 0,
  fees = 0,
  slippage = 0,
}) => {
  const canvasRef = useRef<{ getFlowData: () => FlowData } | null>(null);

  const buildLogic = () => {
    if (!canvasRef.current) return;
    const { nodes, edges } = canvasRef.current.getFlowData();

    if (!nodes.length || !edges.length) {
      alert('⚠️ Please build and connect logic nodes first.');
      return;
    }

    const logic = nodes
      .filter((n) => n.type === 'logicBlock')
      .map((n) => {
        const ins = edges
          .filter((e) => e.target === n.id)
          .map((e) => {
            const sourceNode = nodes.find((x) => x.id === e.source);
            return sourceNode?.data.label || 'Unknown';
          });
        return `IF ${ins.join(' AND ')} THEN ${n.data.action?.toUpperCase() || 'BUY'}`;
      })
      .join('\n');

    axios
      .post('http://localhost:8000/backtest', {
        strategy: 'custom',
        logic,
        data: uploadedOHLCVData,
        sl,
        tp,
        fees,
        slippage,
      })
      .then((res) => onResult(res.data))
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.detail || 'Strategy backtest failed');
      });
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Visual Strategy Builder
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, minHeight: 360 }}>
          <Sidebar />
          <Canvas ref={canvasRef} />
        </Box>
        <Box textAlign="right" sx={{ mt: 2 }}>
          <Button variant="contained" onClick={buildLogic}>
            ⚙️ Build & Run Strategy
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StrategyBuilder;
