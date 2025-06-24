import React from 'react';
import { HeatMapGrid } from 'react-grid-heatmap';

interface RiskHeatmapProps {
  data: number[][];
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) return <div>No data</div>;

  const xLabels = data[0].map((_, i) => `X${i + 1}`);
  const yLabels = data.map((_, i) => `Y${i + 1}`);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ width: '600px', height: '400px' }}>
        <HeatMapGrid
          data={data}
          xLabels={xLabels}
          yLabels={yLabels}
          cellRender={(x: number, y: number, value: number) => <span>{value}</span>}
          cellStyle={(_x: number, _y: number, ratio: number) => ({
            background: `rgb(255, ${255 - ratio * 255}, ${255 - ratio * 255})`,
            fontSize: '12px',
            color: '#000',
          })}
          xLabelsStyle={{ fontSize: '14px' }}
          yLabelsStyle={{ fontSize: '14px' }}
        />
      </div>
    </div>
  );
};

export default RiskHeatmap;
