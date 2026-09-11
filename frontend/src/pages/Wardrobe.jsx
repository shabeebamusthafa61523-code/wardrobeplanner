import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Shirt, Sparkles, Star, Trash2 } from 'lucide-react';
import { fetchWardrobeItems, fetchSavedCombos, deleteSavedCombo } from '../services/api';
import { ClothingCard } from '../components/ClothingCard';
import { AddClothingModal } from '../components/AddClothingModal';
import { WearTrackerModal } from '../components/WearTrackerModal';

export const Wardrobe = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWearModalOpen, setIsWearModalOpen] = useState(false);
  const [selectedComboIds, setSelectedComboIds] = useState([]);

  const categories = ['All', 'Kurti', 'Shirt', 'Top', 'Pants', 'Jeans', 'Dress', 'Saree', 'Scarf', 'Other'];

  useEffect(() => {
    loadWardrobe();
  }, [categoryFilter]);

  const loadWardrobe = async () => {
    try {
      setLoading(true);
      const [itemsRes, combosRes] = await Promise.all([
        fetchWardrobeItems(categoryFilter, searchQuery),
        fetchSavedCombos(),
      ]);
      setItems(itemsRes.data || []);
      setCombos(combosRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wardrobe items:', err);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadWardrobe();
  };

  const handleDeleteCombo = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved combo?')) {
      try {
        await deleteSavedCombo(id);
        loadWardrobe();
      } catch (err) {
        console.error('Error deleting combo:', err);
      }
    }
  };

  const handleWearCombo = (combo) => {
    const ids = combo.itemIds.map((i) => i._id || i);
    setSelectedComboIds(ids);
    setIsWearModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
            My Closet & Saved Combos
          </h1>
          <p className="text-xs sm:text-sm text-sand-500 mt-1">
            Total {items.length} clothes & {combos.length} favorite saved combos
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Clothes</span>
        </button>
      </div>

      {/* SAVED COMBOS BANNER SECTION */}
      {combos.length > 0 && (
        <section className="bg-sand-100/70 p-5 rounded-3xl border border-sand-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-sand-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Saved Favorite Combos</span>
            </h2>
            <span className="text-xs text-sand-500 font-semibold">{combos.length} sets</span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {combos.map((combo) => (
              <div
                key={combo._id}
                onClick={() => handleWearCombo(combo)}
                className="bg-white p-4 rounded-2xl border border-sand-200 hover:border-slate-800 shadow-xs hover:shadow-md transition-all min-w-[240px] max-w-[280px] flex-shrink-0 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-sm text-sand-900 truncate group-hover:text-slate-800">
                      {combo.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteCombo(combo._id, e)}
                      className="p-1 text-sand-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Combo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center -space-x-3 my-2">
                    {combo.itemIds.map((item, idx) => (
                      <img
                        key={idx}
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-14 object-cover rounded-xl border-2 border-white shadow-sm"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-sand-500 font-medium truncate">
                    {combo.itemIds.map((i) => i.name).join(' + ')}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-sand-100 flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span>Wear This Combo</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toolbar: Search and Filter Chips */}
      <div className="space-y-3 bg-white p-4 rounded-3xl border border-sand-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-sand-400" />
          <input
            type="text"
            placeholder="Search by name, color, pattern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
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

      {/* Wardrobe Image Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-sand-400">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Opening your wardrobe...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-sand-300 p-8">
          <div className="h-16 w-16 bg-sand-100 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shirt className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-sand-900">Your wardrobe is empty</h3>
          <p className="text-xs text-sand-500 max-w-sm mx-auto mt-1 mb-6">
            Add your first clothing item to start tracking what you wear and receiving smart outfit recommendations.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <ClothingCard
              key={item._id}
              item={item}
              onClick={(id) => navigate(`/wardrobe/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Clothing Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={loadWardrobe}
      />

      {/* Wear Tracker Modal with Combo pre-selection */}
      <WearTrackerModal
        isOpen={isWearModalOpen}
        onClose={() => setIsWearModalOpen(false)}
        initialSelectedIds={selectedComboIds}
        onWearSaved={loadWardrobe}
      />
    </div>
  );
};
