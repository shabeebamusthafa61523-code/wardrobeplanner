import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Shirt, Trash2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { fetchWardrobeItemById, deleteWardrobeItem, recordWear } from '../services/api';
import { Badge } from '../components/Badge';

export const ClothingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const res = await fetchWardrobeItemById(id);
      setItem(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setLoading(false);
    }
  };

  const handleMarkWornToday = async () => {
    try {
      setMarking(true);
      setMsg('');
      setErrorMsg('');

      const res = await recordWear({
        itemIds: [id],
        source: 'manual',
      });

      if (res.requiresConfirmation) {
        // Force wear override if user confirmed
        const overrideRes = await recordWear({
          itemIds: [id],
          override: true,
          source: 'manual',
        });
        setMsg(overrideRes.message || '✓ Marked as worn today.');
      } else {
        setMsg(res.message || '✓ Marked as worn today.');
      }

      setMarking(false);
      loadItem();
    } catch (err) {
      setMarking(false);
      if (err.response?.data?.isSameDayDuplicate) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to mark as worn today.');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove ${item.name} from your wardrobe?`)) {
      try {
        await deleteWardrobeItem(id);
        navigate('/wardrobe');
      } catch (err) {
        setErrorMsg('Failed to delete clothing item.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sand-400">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-sand-200">
        <h3 className="text-lg font-bold text-sand-900">Item Not Found</h3>
        <button
          onClick={() => navigate('/wardrobe')}
          className="mt-4 px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          Back to Wardrobe
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-sand-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Wardrobe</span>
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl border border-sand-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
        {/* Left Large Photo */}
        <div className="aspect-[3/4] bg-sand-100 relative overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Right Details Panel */}
        <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="neutral" className="mb-2">
                  {item.category}
                </Badge>
                <h1 className="text-2xl font-extrabold text-sand-900 tracking-tight">
                  {item.name}
                </h1>
              </div>

              <button
                onClick={handleDelete}
                className="p-2 text-sand-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                title="Delete item"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {msg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{msg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-3 py-4 border-y border-sand-100 text-xs">
              <div>
                <span className="text-sand-400 block font-medium">Color</span>
                <span className="font-bold text-sand-800 capitalize">{item.color}</span>
              </div>
              <div>
                <span className="text-sand-400 block font-medium">Pattern</span>
                <span className="font-bold text-sand-800">{item.pattern || 'Solid'}</span>
              </div>
              <div>
                <span className="text-sand-400 block font-medium">Season</span>
                <span className="font-bold text-sand-800">{item.season || 'All Season'}</span>
              </div>
              <div>
                <span className="text-sand-400 block font-medium">Total Times Worn</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {item.wearCount || 0} times
                </span>
              </div>
            </div>

            {item.notes && (
              <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200">
                <span className="text-[11px] font-bold text-sand-400 uppercase tracking-wider block mb-1">
                  Notes
                </span>
                <p className="text-xs text-sand-700 leading-relaxed font-medium">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Mark Worn Today Button */}
          <div className="pt-4 border-t border-sand-100">
            <button
              onClick={handleMarkWornToday}
              disabled={marking}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {marking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Mark as Worn Today</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Wear History Log Section */}
      <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-sand-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-800" />
          <span>Wear History</span>
        </h2>

        {!item.wearHistory || item.wearHistory.length === 0 ? (
          <p className="text-xs text-sand-400 font-medium py-4 text-center">
            This clothing item has not been marked as worn yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {item.wearHistory.map((dateStr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-sand-50 rounded-xl border border-sand-100 text-xs font-semibold text-sand-800"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-sand-400" />
                  <span>{dateStr}</span>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                  Recorded
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
