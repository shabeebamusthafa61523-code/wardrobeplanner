import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Sparkles, Search, Bookmark, Star, Trash2 } from 'lucide-react';
import { fetchWardrobeItems, recordWear, fetchSavedCombos, createSavedCombo, deleteSavedCombo, isLoggedIn } from '../services/api';
import { ClothingCard } from './ClothingCard';

export const WearTrackerModal = ({
  isOpen,
  onClose,
  onWearSaved,
  initialSelectedIds = [],
  title,
  submitLabel,
  isPlannerMode = false,
}) => {
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'combos'
  const [items, setItems] = useState([]);
  const [savedCombos, setSavedCombos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [repeatWarning, setRepeatWarning] = useState(null);
  const [comboNameInput, setComboNameInput] = useState('');
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  const initialIdsKey = Array.isArray(initialSelectedIds) ? initialSelectedIds.join(',') : '';

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedIds(initialSelectedIds || []);
      setErrorMsg('');
      setSuccessMsg('');
      setRepeatWarning(null);
      setIsSavingCombo(false);
      setComboNameInput('');
    }
  }, [isOpen, initialIdsKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wardrobeRes, combosRes] = await Promise.all([
        fetchWardrobeItems(),
        fetchSavedCombos(),
      ]);
      setItems(wardrobeRes.data || []);
      setSavedCombos(combosRes.data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Failed to load items.');
    }
  };

  if (!isOpen) return null;

  // ── Login gate ──────────────────────────────────────────────────────────────
  if (!isLoggedIn()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl border border-sand-200 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-sand-400 hover:text-sand-800 hover:bg-sand-100 transition-colors"
          />
          <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-5">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="text-xl font-extrabold text-sand-900 mb-2">Sign in to Record Outfit</h2>
          <p className="text-sm text-sand-500 mb-6">
            You need to be logged in to track what you wear today. Your outfit history is linked to your account.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-auth-modal')); }}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
            >
              Sign In / Register
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl border border-sand-200 text-sand-600 font-semibold text-sm hover:bg-sand-50 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setErrorMsg('');
    setRepeatWarning(null);
  };

  const handleSelectCombo = (combo) => {
    const comboItemIds = combo.itemIds.map((i) => i._id || i);
    setSelectedIds(comboItemIds);
    setSuccessMsg(`✓ Loaded combo "${combo.name}"`);
    setTimeout(() => setSuccessMsg(''), 1500);
  };

  const handleCreateComboSubmit = async (e) => {
    e.preventDefault();
    if (!comboNameInput.trim()) return;
    if (selectedIds.length === 0) {
      setErrorMsg('Please select clothes first before saving as a combo.');
      return;
    }

    try {
      const res = await createSavedCombo({
        name: comboNameInput,
        itemIds: selectedIds,
      });
      setSuccessMsg(res.message || `✓ Saved combo created!`);
      setComboNameInput('');
      setIsSavingCombo(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      setErrorMsg('Failed to save combo.');
    }
  };

  const handleDeleteCombo = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteSavedCombo(id);
      loadData();
    } catch (err) {
      setErrorMsg('Failed to delete combo.');
    }
  };

  const handleSaveOutfit = async (overrideFlag = false) => {
    if (selectedIds.length === 0) {
      setErrorMsg('Please select at least one clothing item.');
      return;
    }

    if (isPlannerMode) {
      setSuccessMsg('✓ Outfit selected for planner.');
      setTimeout(() => {
        onWearSaved && onWearSaved({ itemIds: selectedIds });
        handleClose();
      }, 500);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await recordWear({
        itemIds: selectedIds,
        override: overrideFlag,
        source: 'manual',
      });

      if (res.requiresConfirmation && !overrideFlag) {
        setSubmitting(false);
        setRepeatWarning({
          message: res.message,
          type: res.type,
          daysAgo: res.daysAgo,
        });
        return;
      }

      setSuccessMsg(res.message || '✓ Today\'s outfit saved.');
      setSubmitting(false);

      setTimeout(() => {
        onWearSaved && onWearSaved(res.data);
        handleClose();
      }, 1200);
    } catch (err) {
      setSubmitting(false);
      if (err.response?.data?.isSameDayDuplicate) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to save outfit.');
      }
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    setErrorMsg('');
    setSuccessMsg('');
    setRepeatWarning(null);
    setIsSavingCombo(false);
    onClose();
  };

  const categories = ['All', 'Kurti', 'Shirt', 'Top', 'Pants', 'Jeans', 'Dress', 'Saree', 'Scarf', 'Other'];

  const filteredItems = items.filter((item) => {
    const matchesCat =
      categoryFilter === 'All' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.color.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-sand-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-sand-200 flex flex-col h-[92vh] sm:h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between bg-sand-50">
          <div>
            <h2 className="text-lg font-bold text-sand-900 flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              <span>{title || "Record Today's Outfit"}</span>
            </h2>
            <p className="text-xs text-sand-500 mt-0.5">
              Select individual clothes or tap a pre-saved Combo
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="bg-sand-200 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('items')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'items' ? 'bg-white text-slate-900 shadow-xs' : 'text-sand-700'
                }`}
              >
                Wardrobe
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('combos')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'combos' ? 'bg-white text-slate-900 shadow-xs' : 'text-sand-700'
                }`}
              >
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Combos ({savedCombos.length})</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-sand-400 hover:text-sand-800 hover:bg-sand-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter & Toolbar for Wardrobe Tab */}
        {activeTab === 'items' && (
          <div className="px-6 py-3 border-b border-sand-100 bg-white flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-sand-400" />
              <input
                type="text"
                placeholder="Search clothes or color..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-sand-50 border border-sand-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Repeat Warning Override Banner */}
        {repeatWarning && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{repeatWarning.message}</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Would you like to wear it anyway or choose another outfit?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setRepeatWarning(null)}
                className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100"
              >
                Choose Another
              </button>
              <button
                type="button"
                onClick={() => handleSaveOutfit(true)}
                className="px-4 py-1.5 rounded-xl bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 shadow-sm"
              >
                Wear Anyway
              </button>
            </div>
          </div>
        )}

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Create Combo Input Form overlay */}
        {isSavingCombo && (
          <form
            onSubmit={handleCreateComboSubmit}
            className="mx-6 mt-4 p-4 bg-sand-100/80 rounded-2xl border border-sand-300 flex items-center gap-3 animate-fadeIn"
          >
            <Bookmark className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Name this combo (e.g. Blue Kurti Work Set)..."
              value={comboNameInput}
              onChange={(e) => setComboNameInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-sand-300 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Save Combo
            </button>
            <button
              type="button"
              onClick={() => setIsSavingCombo(false)}
              className="p-2 text-sand-500 hover:text-sand-800"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'combos' ? (
            /* SAVED COMBOS VIEW */
            savedCombos.length === 0 ? (
              <div className="text-center py-16 bg-sand-50 rounded-2xl border border-dashed border-sand-200 p-6">
                <Star className="h-10 w-10 text-amber-400 mx-auto mb-2" />
                <h3 className="font-bold text-sand-900 text-sm">No saved combos yet</h3>
                <p className="text-xs text-sand-500 mt-1 max-w-sm mx-auto">
                  Select clothes from the Wardrobe tab and tap "⭐️ Save as Combo" to create 1-tap reusable sets!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedCombos.map((combo) => {
                  const itemIds = combo.itemIds.map((i) => i._id || i);
                  const isSelectedCombo =
                    itemIds.length > 0 &&
                    itemIds.length === selectedIds.length &&
                    itemIds.every((id) => selectedIds.includes(id));

                  return (
                    <div
                      key={combo._id}
                      onClick={() => handleSelectCombo(combo)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelectedCombo
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900'
                          : 'bg-white text-sand-900 border-sand-200 hover:border-slate-800 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                            <Star
                              className={`h-4 w-4 ${
                                isSelectedCombo
                                  ? 'text-amber-300 fill-amber-300'
                                  : 'text-amber-500 fill-amber-500'
                              }`}
                            />
                            <span>{combo.name}</span>
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCombo(combo._id, e)}
                            className={`p-1 rounded-lg transition-colors ${
                              isSelectedCombo
                                ? 'text-white/60 hover:text-white hover:bg-white/10'
                                : 'text-sand-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Combo Clothes Preview Images */}
                        <div className="flex items-center -space-x-3 my-3">
                          {combo.itemIds.map((item, idx) => (
                            <img
                              key={idx}
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-12 h-14 object-cover rounded-xl border-2 border-white shadow-sm"
                            />
                          ))}
                        </div>

                        <p
                          className={`text-xs font-semibold ${
                            isSelectedCombo ? 'text-sand-300' : 'text-sand-600'
                          }`}
                        >
                          {combo.itemIds.map((i) => i.name).join(' + ')}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-sand-100/20 flex items-center justify-between text-[11px] font-bold">
                        <span>{combo.itemIds.length} Clothes Set</span>
                        <span className={isSelectedCombo ? 'text-amber-300' : 'text-slate-800'}>
                          {isSelectedCombo ? '✓ Selected' : 'Tap to Select →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* WARDROBE ITEMS GRID VIEW */
            loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-sand-400">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium">Loading your wardrobe...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-sand-50 rounded-2xl border border-dashed border-sand-200">
                <p className="text-sand-700 font-semibold text-sm">No clothes found.</p>
                <p className="text-sand-400 text-xs mt-1">Try resetting your filter or search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <ClothingCard
                    key={item._id}
                    item={item}
                    selectable={true}
                    isSelected={selectedIds.includes(item._id)}
                    onSelect={toggleSelect}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-sand-100 bg-sand-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-sand-700">
              Selected: <span className="text-slate-900 font-bold">{selectedIds.length} items</span>
            </div>

            {selectedIds.length > 0 && !isSavingCombo && (
              <button
                type="button"
                onClick={() => setIsSavingCombo(true)}
                className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Star className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
                <span>Save as Combo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-sand-300 text-sand-700 text-xs font-semibold hover:bg-sand-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || submitting}
              onClick={() => handleSaveOutfit(false)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{submitLabel || (isPlannerMode ? 'Save Outfit' : "Save Today's Outfit")}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
