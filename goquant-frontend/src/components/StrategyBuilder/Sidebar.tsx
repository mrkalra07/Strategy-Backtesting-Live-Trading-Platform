import React from 'react';
import './Sidebar.css'; // optional, if you want to style it

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ padding: 10, width: 150, borderRight: '1px solid #ccc' }}>
      <div
        style={{ padding: 8, border: '1px solid #999', marginBottom: 10, cursor: 'grab' }}
        onDragStart={(e) => onDragStart(e, 'indicator')}
        draggable
      >
        📈 Indicator
      </div>
      <div
        style={{ padding: 8, border: '1px solid #999', marginBottom: 10, cursor: 'grab' }}
        onDragStart={(e) => onDragStart(e, 'condition')}
        draggable
      >
        🔁 Condition
      </div>
      <div
        style={{ padding: 8, border: '1px solid #999', marginBottom: 10, cursor: 'grab' }}
        onDragStart={(e) => onDragStart(e, 'value')}
        draggable
      >
        🔢 Value
      </div>
    </aside>
  );
};

export default Sidebar;
