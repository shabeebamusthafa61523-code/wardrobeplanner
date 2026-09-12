import React from 'react';
import { Badge } from './Badge';
import { Clock, Shirt, Check } from 'lucide-react';

export const ClothingCard = ({ item, onClick, selectable, isSelected, onSelect }) => {
  const formattedLastWorn = item.lastWornAt
    ? new Date(item.lastWornAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'Never';

  return (
    <div
      onClick={() => (selectable ? onSelect && onSelect(item._id) : onClick && onClick(item._id))}
      className={`group relative overflow-hidden rounded-2xl bg-white transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md border ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-900 shadow-lg'
          : 'border-sand-200 hover:border-sand-300'
      }`}
    >
      {/* Image container */}
      <div className="aspect-[3/4] w-full bg-sand-100 relative overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Selection indicator checkbox if selectable */}
        {selectable && (
          <div className="absolute top-3 right-3 z-10">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                isSelected ? 'bg-slate-900 text-white shadow-md' : 'bg-white/80 backdrop-blur-sm border border-sand-300'
              }`}
            >
              {isSelected ? <Check className="h-4 w-4 text-white" /> : ''}
            </div>
          </div>
        )}

        {/* Category badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="neutral" className="backdrop-blur-md bg-white/80 border-white/40 shadow-sm">
            {item.category}
          </Badge>
        </div>

        {/* Recently worn warning badge */}
        {item.isRecentlyWorn && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge variant="warning" className="shadow-sm">
              Worn {item.daysSinceLastWorn === 0 ? 'Today' : `${item.daysSinceLastWorn}d ago`}
            </Badge>
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="p-3.5">
        <h3 className="font-semibold text-sand-900 text-sm truncate group-hover:text-slate-800 transition-colors">
          {item.name}
        </h3>

        <div className="mt-2 flex items-center justify-between text-xs text-sand-500 font-medium">
          <div className="flex items-center gap-1.5 capitalize">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-sand-300 shadow-xs"
              style={{
                backgroundColor:
                  item.color.toLowerCase() === 'white'
                    ? '#ffffff'
                    : item.color.toLowerCase() === 'black'
                    ? '#18181b'
                    : item.color.toLowerCase() === 'blue'
                    ? '#2563eb'
                    : item.color.toLowerCase() === 'green'
                    ? '#16a34a'
                    : item.color.toLowerCase() === 'pink'
                    ? '#ec4899'
                    : item.color.toLowerCase() === 'beige'
                    ? '#d4b996'
                    : '#94a3b8',
              }}
            />
            <span>{item.color}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-sand-400" />
            <span>{formattedLastWorn}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-sand-100 flex items-center justify-between text-[11px] text-sand-400">
          <span className="flex items-center gap-1">
            <Shirt className="h-3 w-3" />
            Worn: <strong className="text-sand-700 font-semibold">{item.wearCount || 0} times</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
