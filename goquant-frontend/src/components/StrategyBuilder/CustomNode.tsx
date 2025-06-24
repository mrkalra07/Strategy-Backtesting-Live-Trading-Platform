import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }: any) => {
  return (
    <div style={{ padding: 10, border: '1px solid #999', borderRadius: 4, background: '#fff' }}>
      <Handle type="target" position={Position.Top} />
      <div>
        {data.type === 'indicator' && (
          <>
            <div>
              <select
                value={data.indicatorType}
                onChange={(e) => {
                  const newType = e.target.value;
                  data.indicatorType = newType;
                  data.label = `${newType}(${data.period})`;
                  data.setIndicatorType && data.setIndicatorType(newType);
                }}
              >
                <option value="EMA">EMA</option>
                <option value="SMA">SMA</option>
                <option value="RSI">RSI</option>
              </select>
            </div>
            <div>
              <input
                type="number"
                value={data.period}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  data.setPeriod(val);
                  data.label = `${data.indicatorType}(${val})`;
                }}
                style={{ width: 60 }}
              />
            </div>
          </>
        )}

        {data.type === 'condition' && (
          <select
            value={data.operator}
            onChange={(e) => {
              const op = e.target.value;
              data.setOperator(op);
              data.label = op;
            }}
          >
            <option value=">">{'>'}</option>
            <option value="<">{'<'}</option>
            <option value=">=">{'>='}</option>
            <option value="<=">{'<='}</option>
            <option value="==">{'=='}</option>
          </select>
        )}

        {data.type === 'value' && (
          <input
            type="number"
            value={data.value}
            onChange={(e) => {
              const val = Number(e.target.value);
              data.setValue(val);
              data.label = `${val}`;
            }}
            style={{ width: 60 }}
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;
