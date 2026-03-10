import type { TrackingUpdate } from '../../types/tracking';
import { ExternalLink } from 'lucide-react';

interface UpdateItemProps {
  update: TrackingUpdate;
}

export default function UpdateItem({ update }: UpdateItemProps) {
  const date = new Date(update.timestamp);
  const timeStr = date.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`rounded-lg border p-4 bg-white ${!update.isRead ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm">{update.title}</h3>
        <span className="text-xs text-gray-400 whitespace-nowrap">{timeStr}</span>
      </div>
      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{update.content}</p>
      {update.sources && update.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {update.sources.map(source => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
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
