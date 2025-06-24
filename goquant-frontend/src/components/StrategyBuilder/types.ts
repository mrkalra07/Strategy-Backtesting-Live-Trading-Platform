export type NodeType = 'indicator' | 'condition' | 'value';

export type BaseNodeData = {
  id: string;
  type: NodeType;
  label: string;
};

export type IndicatorNodeData = BaseNodeData & {
  indicatorType: 'EMA' | 'SMA' | 'RSI'; // you can extend this
  period: number;
};

export type ConditionNodeData = BaseNodeData & {
  operator: '>' | '<' | '==' | '>=' | '<=';
};

export type ValueNodeData = BaseNodeData & {
  value: number;
};

export type CustomNodeData = IndicatorNodeData | ConditionNodeData | ValueNodeData;
