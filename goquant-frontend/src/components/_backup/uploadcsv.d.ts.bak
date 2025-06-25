declare module './UploadCSV' {
  import * as React from 'react';

  export interface SymbolMeta {
    exchange: string;
    market_type: string;
  }

  export interface SymbolData {
    [symbol: string]: {
      exchange: string;
      market_type: string;
      ohlcv: Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    };
  }

  export interface UploadCSVProps {
    onUploadSuccess: (data: SymbolData) => void;
    onMetaChange?: (meta: Record<string, SymbolMeta>, files: File[]) => void;
  }

  const UploadCSV: React.FC<UploadCSVProps>;
  export default UploadCSV;
}
