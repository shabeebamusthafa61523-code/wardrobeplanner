import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Shirt,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { fetchTodayOutfit, fetchWearHistory, fetchRecommendation, deleteTodayOutfit } from '../services/api';
import { WearTrackerModal } from '../components/WearTrackerModal';
import { AddClothingModal } from '../components/AddClothingModal';
import { Badge } from '../components/Badge';

export const Home = () => {
  const navigate = useNavigate();
  const [todayOutfits, setTodayOutfits] = useState([]);
  const [recentOutfits, setRecentOutfits] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWearModalOpen, setIsWearModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes, recRes] = await Promise.all([
        fetchTodayOutfit(),
        fetchWearHistory(),
        fetchRecommendation(),
      ]);

      setTodayOutfits(todayRes.data || []);
      setRecentOutfits(historyRes.data?.slice(0, 6) || []);
      setRecommendation(recRes.recommendation || null);
      setWarnings(recRes.warnings || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setLoading(false);
    }
  };

  const handleDeselect = async () => {
    if (!window.confirm("Remove today's outfit record?")) return;
    try {
      setIsRemoving(true);
      await deleteTodayOutfit();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to remove today\'s outfit:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-6">
      {/* Top Welcome Banner */}
      {(() => {
        const userName = localStorage.getItem('wardrobe_user_name') || '';
        const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';
        const hour = new Date().getHours();
        const timeEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-sand-100 via-white to-sand-100 dark:bg-none dark:bg-[#151e2e] p-6 rounded-3xl border border-sand-200 shadow-xs">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain flex-shrink-0 drop-shadow-md" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                  {displayName ? `Hey ${displayName} 👗` : 'Hey there 👗'}
                </h1>
                <p className="text-sand-600 text-sm mt-1">
                  {timeEmoji} What are you wearing today? ✨
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand-200 text-xs font-bold text-sand-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        );
      })()}

      {/* SECTION 1 — TODAY'S OUTFIT */}
      <section className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
            <h2 className="text-lg font-bold text-sand-900">Today's Outfit</h2>
          </div>
          {todayOutfits.length > 0 && (
            <Badge variant="success" className="px-3 py-1">
              ✓ {todayOutfits.length} Saved Today
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sand-400">
            <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching today's outfit record...</p>
          </div>
        ) : todayOutfits.length > 0 ? (
          /* Today's Recorded Outfits — per-item image cards */
          <div className="space-y-4">
            {todayOutfits.map((outfit, idx) => (
              <div key={outfit._id}>
                {/* Divider between multiple outfits */}
                {idx > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-px bg-sand-200" />
                    <span className="text-[10px] font-bold text-sand-400 uppercase tracking-widest">Outfit {idx + 1}</span>
                    <div className="flex-1 h-px bg-sand-200" />
                  </div>
                )}

                {/* Row of individual item cards */}
                <div className="flex flex-wrap items-end gap-2">
                  {outfit.itemIds?.map((item, itemIdx) => (
                    <React.Fragment key={item._id}>
                      {/* + connector between items */}
                      {itemIdx > 0 && (
                        <div className="flex items-center self-center pb-5">
                          <span className="text-lg font-black text-sand-300">+</span>
                        </div>
                      )}

                      {/* Individual item card */}
                      <div className="flex flex-col items-center gap-1.5 w-24">
                        <div className="w-24 h-28 rounded-2xl overflow-hidden bg-sand-100 border-2 border-sand-200 shadow-sm flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Shirt className="h-8 w-8 text-sand-300" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-sand-500 text-center leading-tight px-1 truncate w-full text-center">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-extrabold text-sand-800 text-center leading-tight px-1 truncate w-full text-center">
                          {item.name}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {/* Shared actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsWearModalOpen(true)}
                className="text-xs font-bold text-slate-800 hover:text-slate-900 underline underline-offset-4"
              >
                + Add / Edit Outfit
              </button>
              <span className="text-sand-300 text-xs">|</span>
              <button
                onClick={handleDeselect}
                disabled={isRemoving}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemoving ? 'Removing…' : "❌ Haven't Worn Today"}
              </button>
            </div>
          </div>
        ) : (
          /* Empty Today's Outfit State */
          <div className="text-center py-8 px-4 bg-sand-50/70 rounded-2xl border border-dashed border-sand-300">
            <h3 className="text-lg font-bold text-sand-900">What are you wearing today?</h3>
            <p className="text-xs text-sand-500 max-w-md mx-auto mt-1 mb-6">
              Record your daily work outfit to maintain wear history and prevent unnecessary outfit repeats.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() => setIsWearModalOpen(true)}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-white hover:bg-sand-100 text-sand-900 font-bold text-xs border border-sand-300 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Shirt className="h-4 w-4 text-sand-700" />
                <span>Choose from Wardrobe</span>
              </button>

              <button
                onClick={() => navigate('/scan')}
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4 text-amber-300" />
                <span>📸 Scan Today's Outfit</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2 — REPEAT WARNING BANNER */}
      {warnings && warnings.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Outfit Repeat Warning
            </h3>
            <div className="mt-1 space-y-0.5">
              {warnings.map((w, idx) => (
                <p key={idx} className="text-xs font-semibold text-amber-800">
                  ⚠️ {w.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>✓ No recent outfit repetition detected. Your wardrobe rotation is fresh!</span>
        </div>
      )}

      {/* SECTION 3 — QUICK ACTIONS */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-sand-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-slate-800 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-sand-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-3 text-slate-800">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sand-900 text-sm">Add Clothes</h3>
            <p className="text-[11px] text-sand-400 mt-0.5">Upload new items</p>
          </button>

          <button
            onClick={() => setIsWearModalOpen(true)}
            className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-slate-800 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-sand-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-3 text-slate-800">
              <Shirt className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sand-900 text-sm">I Wore This</h3>
            <p className="text-[11px] text-sand-400 mt-0.5">Manual wear entry</p>
          </button>

          <button
            onClick={() => navigate('/scan')}
            className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-slate-800 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-sand-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-3 text-slate-800">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sand-900 text-sm">Scan Outfit</h3>
            <p className="text-[11px] text-sand-400 mt-0.5">AI recognition</p>
          </button>

          <button
            onClick={() => navigate('/planner')}
            className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-slate-800 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-sand-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-3 text-slate-800">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sand-900 text-sm">Plan My Week</h3>
            <p className="text-[11px] text-sand-400 mt-0.5">Mon–Sat schedule</p>
          </button>
        </div>
      </section>

      {/* SECTION 4 — OUTFIT SUGGESTIONS */}
      {recommendation && recommendation.items && recommendation.items.length > 0 && (
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <h2 className="text-base font-bold tracking-tight">✨ Suggested for Today</h2>
            </div>
            <span className="text-[11px] text-sand-300 font-medium">Smart Rotation Rule</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Suggested Images */}
            <div className="flex items-center -space-x-4">
              {recommendation.items.map((item, idx) => (
                <div
                  key={idx}
                  className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-slate-900 bg-sand-100 shadow-md"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="font-bold text-lg text-white">
                {recommendation.items.map((i) => i.name).join(' + ')}
              </h3>
              <p className="text-xs text-sand-300 font-medium">{recommendation.reason}</p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const ids = recommendation.items.map((i) => i._id);
                    setIsWearModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-sand-100 transition-all shadow-sm"
                >
                  Wear This Combination
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5 — RECENTLY WORN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-sand-900">Recently Worn</h2>
            <p className="text-xs text-sand-500">Last 5–7 outfits recorded</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-xs font-bold text-sand-700 hover:text-slate-900"
          >
            <span>View History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentOutfits.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-sand-200">
            <p className="text-sand-600 text-xs font-semibold">No recent outfits recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentOutfits.map((outfit) => (
              <div
                key={outfit._id}
                className="bg-white rounded-2xl p-4 border border-sand-200 shadow-sm hover:shadow-md transition-all"
              >
                {/* Date row */}
                <div className="flex items-center gap-1.5 text-sand-500 mb-3">
                  <Clock className="h-3 w-3 text-sand-400" />
                  <span className="text-[11px] font-bold">{outfit.date}</span>
                  <Badge variant="neutral" className="ml-auto text-[10px]">
                    {outfit.source === 'ai' ? '📸 AI' : 'Manual'}
                  </Badge>
                </div>

                {/* Per-item cards */}
                <div className="flex flex-wrap items-end gap-1.5">
                  {outfit.itemIds?.map((item, itemIdx) => (
                    <React.Fragment key={item._id}>
                      {itemIdx > 0 && (
                        <div className="flex items-center self-center pb-5">
                          <span className="text-base font-black text-sand-300">+</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-1 w-16">
                        <div className="w-16 h-20 rounded-xl overflow-hidden bg-sand-100 border-2 border-sand-200 shadow-sm flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Shirt className="h-6 w-6 text-sand-300" />
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-sand-500 text-center truncate w-full px-0.5">
                          {item.category}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <WearTrackerModal
        isOpen={isWearModalOpen}
        onClose={() => setIsWearModalOpen(false)}
        onWearSaved={loadDashboardData}
      />
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={loadDashboardData}
      />
    </div>
  );
};
