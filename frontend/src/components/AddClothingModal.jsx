import React, { useState } from 'react';
import { X, Camera, Sparkles, Image as ImageIcon } from 'lucide-react';
import { createWardrobeItem } from '../services/api';

const CATEGORIES = ['Kurti', 'Shirt', 'Top', 'Pants', 'Jeans', 'Dress', 'Saree', 'Scarf', 'Other'];

export const AddClothingModal = ({ isOpen, onClose, onItemAdded }) => {
  const [category, setCategory] = useState('Kurti');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrlInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!imageFile && !imageUrlInput.trim()) {
      setError('A clothing photo is required.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('category', category);
      formData.append('notes', notes);

      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        formData.append('imageUrl', imageUrlInput);
      }

      const res = await createWardrobeItem(formData);
      setSuccessMsg(res.message || `✓ ${category} added to your wardrobe.`);
      setLoading(false);

      setTimeout(() => {
        onItemAdded && onItemAdded(res.data);
        handleClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to add clothing item.');
    }
  };

  const handleClose = () => {
    setCategory('Kurti');
    setNotes('');
    setImageFile(null);
    setImagePreview('');
    setImageUrlInput('');
    setError('');
    setSuccessMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-sand-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-sand-200 flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between bg-sand-50">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
            <h2 className="text-lg font-bold text-sand-900">Add to Wardrobe</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-sand-400 hover:text-sand-800 hover:bg-sand-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 font-semibold animate-pulse">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-sand-700 uppercase tracking-wider mb-2">
              Clothing Photo <span className="text-rose-500">*</span>
            </label>

            <div className="mt-1 flex flex-col items-center">
              {imagePreview || imageUrlInput ? (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-sand-100 border border-sand-300 group">
                  <img
                    src={imagePreview || imageUrlInput}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setImageUrlInput('');
                    }}
                    className="absolute top-3 right-3 p-2 bg-sand-900/70 text-white rounded-full hover:bg-sand-900 transition-all shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-sand-300 hover:border-slate-800 bg-sand-50 hover:bg-sand-100/50 flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-sand-200 text-slate-800 mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-sand-800">
                    Upload Photo or Take Shot
                  </span>
                  <span className="text-xs text-sand-400 mt-1">PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Optional Image URL Input */}
            {!imagePreview && (
              <div className="mt-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-sand-400" />
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-sand-700 uppercase tracking-wider mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm font-medium bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-sand-700 uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="Fabric details, pair suggestions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-sand-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-sand-300 text-sand-700 font-semibold text-sm hover:bg-sand-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Clothes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
