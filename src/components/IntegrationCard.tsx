import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SubApp {
  name: string;
  handle: string;
  icon: React.ReactNode;
  detailLink?: boolean;
}

interface IntegrationCardProps {
  name: string;
  handle?: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  onToggle: () => void;
  expandable?: boolean;
  subApps?: SubApp[];
  actionText?: string;
}

export function IntegrationCard({
  name,
  handle,
  description,
  icon,
  isEnabled,
  onToggle,
  expandable = false,
  subApps = [],
  actionText,
}: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
      expandable && isExpanded 
        ? 'bg-gradient-to-br from-gray-50/80 to-purple-50/40 border-indigo-100/50 hover:shadow-indigo-100/30' 
        : 'bg-gradient-to-br from-white/80 to-indigo-50/30 backdrop-blur-sm border-indigo-100/50 hover:shadow-indigo-100/50'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 mb-1">{name}</h3>
              {handle && !expandable && (
                <p className="text-sm text-gray-500 mb-2">{handle}</p>
              )}
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${
              isEnabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
            aria-label={isEnabled ? '無効化' : '有効化'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {expandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            {isExpanded ? '詳細を非表示' : '詳細'}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {expandable && isExpanded && subApps.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {subApps.map((subApp, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 hover:shadow-sm transition-all border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{subApp.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-0.5">
                      {subApp.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{subApp.handle}</p>
                    {subApp.detailLink && (
                      <a
                        href="#"
                        className="text-xs text-indigo-600 hover:text-indigo-700 inline-block"
                      >
                        詳細
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {actionText && (
          <div className="mt-6 pt-6 border-t border-indigo-100/50">
            <button className="w-full py-3 px-4 bg-white/80 hover:bg-white rounded-xl text-sm text-gray-700 border border-indigo-100 transition-colors">
              {actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
