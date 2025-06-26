// src/components/StrategyBuilder/VisualStrategyBuilder.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Button } from '@mui/material';
// @ts-ignore
import UploadCSV from '../UploadCSV';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Optionally import types for UploadCSV if needed
// import type { SymbolData } from '../uploadcsv';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {};

const VisualStrategyBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [dataUploaded, setDataUploaded] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Edge | Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Fix: add types for event and node
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Simple node adders for demo
  const addNode = (type: string, label: string) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'default',
      position: { x: 250, y: 100 + nds.length * 60 },
      data: { label, nodeType: type },
    }));
  };

  const handleNodeDataChange = (field: string, value: any) => {
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? {
      ...n,
      data: { ...n.data, [field]: value }
    } : n));
  };

  if (!dataUploaded) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6 }}>
        <Typography variant="h5" gutterBottom>Upload Data to Start Building Your Strategy</Typography>
        <UploadCSV onUploadSuccess={(data: any) => { setUploadedData(data); setDataUploaded(true); }} />
      </Box>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '70vh', background: 'transparent', borderRadius: 12 }}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar controls */}
        <div style={{ width: 240, background: '#23272e', color: '#fff', padding: 18, borderRadius: 12, marginRight: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Strategy Builder</div>
          <button onClick={() => addNode('asset', 'Asset/Market Selector')} style={{ marginBottom: 8, width: '100%' }}>+ Asset/Market</button>
          <button onClick={() => addNode('indicator', 'Indicator')} style={{ marginBottom: 8, width: '100%' }}>+ Indicator</button>
          <button onClick={() => addNode('logic', 'Logic Operator')} style={{ marginBottom: 8, width: '100%' }}>+ Logic</button>
          <button onClick={() => addNode('execution', 'Execution')} style={{ marginBottom: 8, width: '100%' }}>+ Execution</button>
          <button onClick={() => addNode('risk', 'Risk Management')} style={{ marginBottom: 8, width: '100%' }}>+ Risk</button>
        </div>
        {/* Canvas and Node property sidebar */}
        <div style={{ flex: 1, background: '#181a20', borderRadius: 12, padding: 0, position: 'relative', display: 'flex', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 500, height: '100%' }}>
            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
            >
              <Background color="#23272e" gap={18} />
              <Controls />
            </ReactFlow>
          </div>
          {/* Node property sidebar */}
          {selectedNode && (
            <Box sx={{ width: 300, background: '#23272e', color: '#fff', p: 3, borderRadius: 2, ml: 2, minHeight: '100%' }}>
              <Typography variant="h6" gutterBottom>Node Properties</Typography>
              <Typography variant="subtitle2" gutterBottom>Type: {selectedNode.data.nodeType}</Typography>
              <Typography variant="subtitle2" gutterBottom>Label: {selectedNode.data.label}</Typography>
              {/* Dynamic fields based on node type */}
              {selectedNode.data.nodeType === 'indicator' && (
                <>
                  <label style={{ display: 'block', marginTop: 12 }}>Indicator</label>
                  <select
                    value={selectedNode.data.indicatorType || 'rsi'}
                    onChange={e => handleNodeDataChange('indicatorType', e.target.value)}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  >
                    <option value="rsi">RSI</option>
                    <option value="ema">EMA</option>
                    <option value="macd">MACD</option>
                  </select>
                  <label>Period</label>
                  <input
                    type="number"
                    value={selectedNode.data.period || 14}
                    onChange={e => handleNodeDataChange('period', Number(e.target.value))}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  />
                </>
              )}
              {selectedNode.data.nodeType === 'logic' && (
                <>
                  <label style={{ display: 'block', marginTop: 12 }}>Logic Operator</label>
                  <select
                    value={selectedNode.data.logicType || 'and'}
                    onChange={e => handleNodeDataChange('logicType', e.target.value)}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                    <option value="not">NOT</option>
                    <option value="xor">XOR</option>
                    <option value="nand">NAND</option>
                    <option value="nor">NOR</option>
                    <option value="xnor">XNOR</option>
                    <option value="if">IF</option>
                    <option value="else">ELSE</option>
                    <option value="gt">&gt; (Greater Than)</option>
                    <option value="lt">&lt; (Less Than)</option>
                    <option value="eq">== (Equal)</option>
                    <option value="neq">!= (Not Equal)</option>
                  </select>
                </>
              )}
              {selectedNode.data.nodeType === 'asset' && (
                <>
                  <label style={{ display: 'block', marginTop: 12 }}>Symbol</label>
                  <input
                    type="text"
                    value={selectedNode.data.symbol || ''}
                    onChange={e => handleNodeDataChange('symbol', e.target.value)}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  />
                </>
              )}
              {selectedNode.data.nodeType === 'execution' && (
                <>
                  <label style={{ display: 'block', marginTop: 12 }}>Order Type</label>
                  <select
                    value={selectedNode.data.orderType || 'market'}
                    onChange={e => handleNodeDataChange('orderType', e.target.value)}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  >
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </>
              )}
              {selectedNode.data.nodeType === 'risk' && (
                <>
                  <label style={{ display: 'block', marginTop: 12 }}>Max Drawdown (%)</label>
                  <input
                    type="number"
                    value={selectedNode.data.maxDrawdown || 10}
                    onChange={e => handleNodeDataChange('maxDrawdown', Number(e.target.value))}
                    style={{ width: '100%', padding: 6, borderRadius: 4, marginBottom: 12 }}
                  />
                </>
              )}
              <Button variant="contained" color="secondary" sx={{ mt: 2, mr: 1 }} onClick={() => setSelectedNodeId(null)}>
                Close
              </Button>
              <Button variant="outlined" color="error" sx={{ mt: 2 }}
                onClick={() => {
                  if (selectedNodeId) {
                    setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
                    setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
                    setSelectedNodeId(null);
                  }
                }}
              >
                Delete Node
              </Button>
            </Box>
          )}
        </div>
      </div>
      {/* Export/Run Strategy button below builder */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              const logicString = convertGraphToLogicString(nodes, edges);
              console.log({ logicString, uploadedData, nodes, edges });
              if (!logicString.trim()) {
                alert('No valid logic detected. Please connect indicators, logic, and execution nodes.');
                return;
              }
              if (!uploadedData || Object.keys(uploadedData).length === 0) {
                alert('No data uploaded. Please upload OHLCV data first.');
                return;
              }
              const res = await fetch('http://localhost:8000/strategy/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logic: logicString, data: uploadedData, nodes, edges }),
              });
              if (res.ok) {
                const result = await res.json();
                setBacktestResult(result);
              } else {
                const err = await res.json().catch(() => ({}));
                alert('Backend error: ' + (err.detail || res.status));
              }
            } catch (err) {
              alert('Network error: ' + err);
            }
          }}
        >
          Export / Run Strategy
        </Button>
      </div>
      {/* Styled summary for backtest result - now always below the builder/canvas */}
      {backtestResult && (
        <Box sx={{ mt: 2, p: 3, background: 'linear-gradient(135deg, #23272e 60%, #181a20 100%)', color: '#fff', borderRadius: 3, maxWidth: 1000, mx: 'auto', boxShadow: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1, color: '#90caf9' }}>Backtest Result</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Status:</b> <span style={{ color: '#90caf9' }}>{backtestResult.status || 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Symbol:</b> <span style={{ color: '#ffd600' }}>{backtestResult.symbol || 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Node Count:</b> <span style={{ color: '#00e676' }}>{backtestResult.node_count || 0}</span> &nbsp; <b>Edge Count:</b> <span style={{ color: '#00e676' }}>{backtestResult.edge_count || 0}</span></Typography>
            </Box>
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Total Profit:</b> <span style={{ color: '#00e676', fontWeight: 700 }}>{backtestResult.total_profit !== null && backtestResult.total_profit !== undefined ? backtestResult.total_profit.toFixed(2) : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Num Trades:</b> <span style={{ color: '#ffd600' }}>{backtestResult.num_trades !== null && backtestResult.num_trades !== undefined ? backtestResult.num_trades : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Win Rate:</b> <span style={{ color: '#ffd600' }}>{backtestResult.win_rate !== null && backtestResult.win_rate !== undefined ? backtestResult.win_rate.toFixed(1) + '%' : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Max Drawdown:</b> <span style={{ color: '#ff1744' }}>{backtestResult.max_drawdown !== null && backtestResult.max_drawdown !== undefined ? backtestResult.max_drawdown.toFixed(2) : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Sharpe Ratio:</b> <span style={{ color: '#90caf9' }}>{backtestResult.sharpe_ratio !== null && backtestResult.sharpe_ratio !== undefined ? backtestResult.sharpe_ratio.toFixed(2) : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Sortino Ratio:</b> <span style={{ color: '#90caf9' }}>{backtestResult.sortino_ratio !== null && backtestResult.sortino_ratio !== undefined ? backtestResult.sortino_ratio.toFixed(2) : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Profit Factor:</b> <span style={{ color: '#90caf9' }}>{backtestResult.profit_factor !== null && backtestResult.profit_factor !== undefined ? backtestResult.profit_factor.toFixed(2) : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Annualized Return:</b> <span style={{ color: '#00e676' }}>{backtestResult.annualized_return !== null && backtestResult.annualized_return !== undefined ? (backtestResult.annualized_return * 100).toFixed(2) + '%' : 'N/A'}</span></Typography>
              <Typography variant="body1" sx={{ mb: 1 }}><b>Annualized Volatility:</b> <span style={{ color: '#ffb300' }}>{backtestResult.annualized_volatility !== null && backtestResult.annualized_volatility !== undefined ? (backtestResult.annualized_volatility * 100).toFixed(2) + '%' : 'N/A'}</span></Typography>
            </Box>
          </Box>
          <Box sx={{ borderBottom: '2px solid #444', my: 3 }} />
          {/* Equity Curve Chart */}
          {backtestResult.equity_curve && Array.isArray(backtestResult.equity_curve) && backtestResult.equity_curve.length > 0 && (
            <Box sx={{ mt: 2, mb: 3, background: '#181a20', borderRadius: 2, p: 2, boxShadow: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: '#00e676', fontWeight: 600 }}>Equity Curve</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={backtestResult.equity_curve} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" tick={{ fill: '#fff', fontSize: 12 }} hide={backtestResult.equity_curve.length > 30} />
                  <YAxis tick={{ fill: '#fff', fontSize: 12 }} width={70} />
                  <Tooltip contentStyle={{ background: '#222', color: '#fff', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="equity" stroke="#00e676" dot={false} strokeWidth={2} name="Equity" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          {/* Drawdown Curve Chart */}
          {backtestResult.drawdown_curve && Array.isArray(backtestResult.drawdown_curve) && backtestResult.drawdown_curve.length > 0 && (
            <Box sx={{ mt: 2, mb: 1, background: '#181a20', borderRadius: 2, p: 2, boxShadow: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: '#ff1744', fontWeight: 600 }}>Drawdown Curve</Typography>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={backtestResult.drawdown_curve} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" tick={{ fill: '#fff', fontSize: 12 }} hide={backtestResult.drawdown_curve.length > 30} />
                  <YAxis tick={{ fill: '#fff', fontSize: 12 }} width={70} />
                  <Tooltip contentStyle={{ background: '#222', color: '#fff', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="drawdown" stroke="#ff1744" dot={false} strokeWidth={2} name="Drawdown" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
};

// --- Logic string converter ---
function convertGraphToLogicString(nodes: any[], edges: any[]): string {
  const getNodeById = (id: string) => nodes.find(n => n.id === id);
  const logicOpMap: Record<string, string> = {
    gt: '>',
    lt: '<',
    eq: '==',
    neq: '!=',
    and: 'and',
    or: 'or',
    not: 'not',
    xor: '^',
    nand: 'nand',
    nor: 'nor',
    xnor: 'xnor',
  };
  let logicLines: string[] = [];
  for (const execNode of nodes.filter(n => n.data?.nodeType === 'execution')) {
    const inputEdge = edges.find(e => e.target === execNode.id);
    if (!inputEdge) continue;
    const logicNode = getNodeById(inputEdge.source);
    if (!logicNode || logicNode.data?.nodeType !== 'logic') continue;
    const logicType = logicNode.data.logicType || 'gt';
    const op = logicOpMap[logicType] || logicType;
    const inputs = edges
      .filter(e => e.target === logicNode.id)
      .map(e => getNodeById(e.source));
    const inputStrs = inputs.map(n => {
      if (n.data.nodeType === 'indicator') {
        const type = n.data.indicatorType?.toUpperCase() || 'IND';
        const period = n.data.period;
        return `${type}_${period}`;
      }
      if (n.data.nodeType === 'asset') {
        return n.data.symbol || n.data.label || 'ASSET';
      }
      if (n.data.nodeType === 'risk') {
        return `MAX_DRAWDOWN_${n.data.maxDrawdown || ''}`;
      }
      return n.data.label || 'X';
    });
    const condition = inputStrs.join(` ${op} `);
    const action = execNode.data.orderType === 'market' ? 'BUY' : 'SELL';
    logicLines.push(`IF ${condition} THEN ${action}`);
  }
  return logicLines.join('\n');
}

export default VisualStrategyBuilder;
