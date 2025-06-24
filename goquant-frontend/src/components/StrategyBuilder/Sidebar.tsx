import React from 'react';
import './Sidebar.css';

const indicators = [
  { type: 'indicator', label: 'RSI' },
  { type: 'indicator', label: 'EMA' },
  { type: 'indicator', label: 'MACD' }
];

const conditions = [
  { type: 'condition', label: '>' },
  { type: 'condition', label: '<' },
  { type: 'condition', label: '>=' },
  { type: 'condition', label: '<=' },
  { type: 'condition', label: '==' },
  { type: 'condition', label: '!=' }
];

const values = [
  { type: 'value', label: '30' },
  { type: 'value', label: '50' },
  { type: 'value', label: '70' }
];

const logicBlocks = [
  { type: 'logicBlock', label: 'IF ... THEN BUY/SELL' }
];

const Sidebar = () => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, node: { type: string; label: string }) => {
  event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
  event.dataTransfer.effectAllowed = 'move';
};


  return (
    <aside className="sidebar">
      <h3>📊 Indicators</h3>
      {indicators.map((node, index) => (
        <div
          key={`ind-${index}`}
          className="sidebar-item"
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
        >
          {node.label}
        </div>
      ))}

      <h3>🔍 Conditions</h3>
      {conditions.map((node, index) => (
        <div
          key={`cond-${index}`}
          className="sidebar-item"
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
        >
          {node.label}
        </div>
      ))}

      <h3>🔢 Values</h3>
      {values.map((node, index) => (
        <div
          key={`val-${index}`}
          className="sidebar-item"
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
        >
          {node.label}
        </div>
      ))}

      <h3>🧠 Logic</h3>
      {logicBlocks.map((node, index) => (
        <div
          key={`logic-${index}`}
          className="sidebar-item"
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
        >
          {node.label}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
