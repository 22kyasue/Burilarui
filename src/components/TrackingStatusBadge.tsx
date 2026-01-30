import { Circle, Settings } from 'lucide-react';
import { forwardRef } from 'react';

interface TrackingStatusBadgeProps {
  theme: string;
  frequency: string;
  onManage: () => void;
}

export const TrackingStatusBadge = forwardRef<HTMLDivElement, TrackingStatusBadgeProps>(
  ({ theme, frequency, onManage }, ref) => {
  return (
    <div className="max-w-3xl mx-auto mt-4 mb-12" ref={ref}>
      <div 
        onClick={onManage}
        className="bg-white border border-emerald-200/50 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 hover:border-indigo-200/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Circle 
              className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" 
            />
            <span className="text-sm text-gray-900 font-medium">追跡中</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="truncate max-w-[300px]">{theme}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{frequency}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
          className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1.5 transition-colors px-3 py-1.5 hover:bg-indigo-50 rounded-lg"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>詳細</span>
        </button>
      </div>
    </div>
  );
});

TrackingStatusBadge.displayName = 'TrackingStatusBadge';