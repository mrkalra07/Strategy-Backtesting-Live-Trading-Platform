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
      console.log("📦 Nodes:", nodes);
      console.log("🔗 Edges:", edges);

      // TODO: convert nodes + edges → logic JSON
      const logic = { nodes, edges };

      onBuild(logic);
    }
  };

  return (
    <div className="strategy-builder" style={{ display: 'flex', gap: 16 }}>
      <Sidebar />
      <Canvas ref={canvasRef} />
      <div>
        <button onClick={handleBuildAndRun}>⚙️ Build & Run Strategy</button>
      </div>
    </div>
  );
};

export default StrategyBuilder;
