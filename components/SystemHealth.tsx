import React from 'react';
import { GatewayStatus } from '../types';
import { Wifi, Signal, Database, UploadCloud, Activity } from 'lucide-react';
import { formatDateTime } from '../services/dataService';

interface Props {
  status: GatewayStatus;
}

export const SystemHealth: React.FC<Props> = ({ status }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity size={16} />
        Gateway Health
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <UploadCloud size={12} /> Network Mode
          </span>
          <span className="font-medium text-slate-700">{status.network}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Signal size={12} /> Operator
          </span>
          <span className="font-medium text-slate-700">{status.simOperator}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            {status.network === 'WiFi' ? <Wifi size={12} /> : <Signal size={12} />}
            Signal Strength
          </span>
          <span className="font-medium text-slate-700">
            {status.network === 'WiFi' ? `${status.wifiSignal} dBm` : `${status.gsmSignal} CSQ`}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Database size={12} /> SD Storage
          </span>
          <span className="font-medium text-slate-700">{status.sdFree} MB Free</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            <Activity size={12} /> Last Sync
          </span>
          <span className="font-medium text-slate-700 text-xs truncate" title={status.lastBatchUpload}>
            {formatDateTime(status.lastBatchUpload)}
          </span>
        </div>

      </div>
    </div>
  );
};