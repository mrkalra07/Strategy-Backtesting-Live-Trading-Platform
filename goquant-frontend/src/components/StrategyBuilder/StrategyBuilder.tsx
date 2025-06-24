import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import './StrategyBuilder.css';

type StrategyBuilderProps = {
  onBuild: (logic: any) => void;
};

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onBuild }) => {
  const canvasRef = useRef<any>(null);

  const handleBuildAndRun = () => {
    if (canvasRef.current) {
      const { nodes, edges } = canvasRef.current.getFlowData();
      console.log('📦 Nodes:', nodes);
      console.log('🔗 Edges:', edges);

      if (nodes.length === 0 || edges.length === 0) {
        alert('⚠️ Please build a strategy by adding and connecting nodes.');
        return;
      }

      const logic = { nodes, edges };
      onBuild(logic);
    }
  };

  return (
    <div className="strategy-builder" style={{ display: 'flex', gap: 16, height: '100%' }}>
      <Sidebar />
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Canvas ref={canvasRef} />
        <div style={{ marginTop: 10 }}>
          <button onClick={handleBuildAndRun}>⚙️ Build & Run Strategy</button>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
