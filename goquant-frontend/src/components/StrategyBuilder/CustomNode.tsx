// src/components/StrategyBuilder/CustomNode.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';

type CustomNodeProps = {
  data: any;
  id: string;
};

const CustomNode: React.FC<CustomNodeProps> = ({ data, id }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    if (data.setPeriod) data.setPeriod(Number(value));
    if (data.setValue) data.setValue(Number(value));
    if (data.setOperator) data.setOperator(value);
    if (data.setIndicatorType) data.setIndicatorType(value);
  };

  const renderContent = () => {
    if (data.period !== undefined) {
      return (
        <>
          <label>Period:</label>
          <input type="number" value={data.period} onChange={handleChange} />
        </>
      );
    } else if (data.value !== undefined) {
      return (
        <>
          <label>Value:</label>
          <input type="number" value={data.value} onChange={handleChange} />
        </>
      );
    } else if (data.operator !== undefined) {
      return (
        <>
          <label>Operator:</label>
          <select value={data.operator} onChange={handleChange}>
            <option value=">">{'>'}</option>
            <option value="<">{'<'}</option>
            <option value=">=">{'>='}</option>
            <option value="<=">{'<='}</option>
            <option value="==">{'=='}</option>
          </select>
        </>
      );
    }
    return <div>{data.label}</div>;
  };

  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Top} id={`${id}-target`} style={{ background: '#555' }} />
      <div>{renderContent()}</div>
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} style={{ background: '#555' }} />
    </div>
  );
};

export default CustomNode;
