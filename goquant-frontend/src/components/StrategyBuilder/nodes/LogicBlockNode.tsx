import React from 'react';
import { Handle, Position } from 'reactflow';

type Props = {
  data: any;
  id: string;
};

const LogicBlockNode = ({ data, id }: Props) => {
  return (
    <div className="custom-node">
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        data-id={`handle-${id}-target`}
        style={{ background: '#915EFF' }}
      />
      <div>🔀 IF ... THEN BUY/SELL</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        data-id={`handle-${id}-source`}
        style={{ background: '#915EFF' }}
      />
    </div>
  );
};

export default LogicBlockNode;
