// src/components/StrategyBuilder/Canvas.tsx
import React, {
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react';
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
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode
};

const Canvas = forwardRef((props, ref) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Edge | Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = { x: event.clientX - 250, y: event.clientY - 80 };
    const id = `node_${Date.now()}`;

    const baseData = {
      id,
      type,
      setPeriod: (val: number) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, period: val, label: `${n.data.indicatorType}(${val})` } } : n
          )
        );
      },
      setValue: (val: number) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, value: val, label: `${val}` } } : n
          )
        );
      },
      setOperator: (op: string) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, operator: op, label: op } } : n
          )
        );
      },
      setIndicatorType: (type: string) => {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    indicatorType: type,
                    label: `${type}(${n.data.period})`
                  }
                }
              : n
          )
        );
      }
    };

    let newNode: Node;

    if (type === 'indicator') {
      newNode = {
        id,
        type: 'custom',
        position,
        data: {
          ...baseData,
          label: 'EMA(14)',
          indicatorType: 'EMA',
          period: 14
        }
      };
    } else if (type === 'condition') {
      newNode = {
        id,
        type: 'custom',
        position,
        data: {
          ...baseData,
          label: '>',
          operator: '>'
        }
      };
    } else if (type === 'value') {
      newNode = {
        id,
        type: 'custom',
        position,
        data: {
          ...baseData,
          label: '50',
          value: 50
        }
      };
    } else {
      newNode = {
        id,
        type: 'custom',
        position,
        data: {
          ...baseData,
          label: `${type.toUpperCase()} Node`
        }
      };
    }

    setNodes((nds) => [...nds, newNode]);
  }, []);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  useImperativeHandle(ref, () => ({
    getFlowData: () => ({ nodes, edges })
  }));

  return (
    <div
      style={{ height: 600, border: '1px solid #ccc', position: 'relative' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
});

export default Canvas;
