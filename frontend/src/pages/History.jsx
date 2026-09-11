import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Filter, Search, Clock, Calendar as CalendarIcon, Shirt } from 'lucide-react';
import { fetchWearHistory, fetchWardrobeItems } from '../services/api';
import { Badge } from '../components/Badge';

export const History = () => {
  const [history, setHistory] = useState([]);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const categories = ['All', 'Kurti', 'Shirt', 'Top', 'Pants', 'Jeans', 'Dress', 'Saree', 'Scarf', 'Other'];

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedItemId, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyRes, wardrobeRes] = await Promise.all([
        fetchWearHistory({
          category: selectedCategory,
          itemId: selectedItemId,
          date: dateFilter,
        }),
        fetchWardrobeItems(),
      ]);

      setHistory(historyRes.data || []);
      setWardrobeItems(wardrobeRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading history:', err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-7 w-7 text-slate-800" />
          <span>Wear History Log</span>
        </h1>
        <p className="text-xs sm:text-sm text-sand-500 mt-1">
          Complete chronological record of all outfits worn and recorded over time.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-sand-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-sand-400 uppercase tracking-wider mb-1">
              Filter Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-sand-50 border border-sand-200 text-xs font-semibold focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clothing Item Filter */}
          <div>
            <label className="block text-[11px] font-bold text-sand-400 uppercase tracking-wider mb-1">
              Specific Clothing Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-sand-50 border border-sand-200 text-xs font-semibold focus:outline-none"
            >
              <option value="">All Clothes</option>
              {wardrobeItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.color})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-sand-400 uppercase tracking-wider mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-sand-50 border border-sand-200 text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        {(selectedCategory !== 'All' || selectedItemId || dateFilter) && (
          <div className="pt-2 border-t border-sand-100 flex items-center justify-end">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedItemId('');
                setDateFilter('');
              }}
              className="text-xs font-bold text-slate-800 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* History Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-sand-400">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Fetching history records...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-sand-300">
          <p className="text-sand-700 font-bold text-sm">No wear records match your criteria.</p>
          <p className="text-sand-400 text-xs mt-1">Start marking outfits as worn to build history!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div
              key={record._id}
              className="bg-white rounded-3xl border border-sand-200 p-5 shadow-sm hover:shadow-md transition-all"
            >
              {/* Date + source row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sand-600">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-extrabold">{record.date}</span>
                </div>
                <Badge variant={record.source === 'ai' ? 'accent' : 'neutral'}>
                  {record.source === 'ai' ? '📸 AI' : 'Manual'}
                </Badge>
              </div>

              {/* Per-item image cards */}
              <div className="flex flex-wrap items-end gap-2">
                {record.itemIds?.map((item, itemIdx) => (
                  <React.Fragment key={item._id}>
                    {itemIdx > 0 && (
                      <div className="flex items-center self-center pb-5">
                        <span className="text-lg font-black text-sand-300">+</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1.5 w-20">
                      <div className="w-20 h-24 rounded-2xl overflow-hidden bg-sand-100 border-2 border-sand-200 shadow-sm flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shirt className="h-7 w-7 text-sand-300" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-sand-500 text-center leading-tight truncate w-full px-1">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-extrabold text-sand-800 text-center leading-tight truncate w-full px-1">
                        {item.name}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
