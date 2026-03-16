import type { TrackingUpdate } from '../../types/tracking';
import { ExternalLink } from 'lucide-react';

interface UpdateItemProps {
  update: TrackingUpdate;
}

export default function UpdateItem({ update }: UpdateItemProps) {
  const date = new Date(update.timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let timeStr: string;
  if (minutes < 60) timeStr = `${minutes}分前`;
  else if (hours < 24) timeStr = `${hours}時間前`;
  else timeStr = `${days}日前`;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      !update.isRead
        ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 shadow-sm'
        : 'border-gray-100 bg-white hover:border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {!update.isRead && (
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex-shrink-0" />
          )}
          <h3 className="font-medium text-sm text-gray-900">{update.title}</h3>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{timeStr}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{update.content}</p>
      {update.sources && update.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {update.sources.map(source => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {source.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
