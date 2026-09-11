import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw, Shirt, Edit3 } from 'lucide-react';
import { scanOutfitImage, recordWear, isLoggedIn } from '../services/api';
import { Badge } from '../components/Badge';
import { WearTrackerModal } from '../components/WearTrackerModal';

export const AIScanner = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // User override match selection state
  const [selectedMatchIds, setSelectedMatchIds] = useState([]);

  if (!isLoggedIn()) {
    return (
      <div className="space-y-6 pb-12 animate-fadeIn max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-sand-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
            <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
            <span>AI Outfit Scanner</span>
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-sand-200 p-8 shadow-sm text-center space-y-5">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-sand-900 mb-1">
              Sign in to Scan Outfit
            </h1>
            <p className="text-xs text-sand-500 max-w-md mx-auto">
              You need to be logged in to analyze your outfit with AI vision and save it to your history.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
              className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-md"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setScanResult(null);
      setScanError('');
      setSavedSuccess(false);
    }
  };

  const handleRunScan = async () => {
    if (!imageFile) return;

    try {
      setScanning(true);
      setScanError('');
      setScanResult(null);

      const res = await scanOutfitImage(imageFile);
      setScanResult(res);

      // Pre-select best match IDs
      if (res.matches && Array.isArray(res.matches)) {
        const initialSelected = res.matches
          .filter((m) => m.matchedItem && m.matchedItem._id)
          .map((m) => m.matchedItem._id);
        setSelectedMatchIds(initialSelected);
      }

      setScanning(false);
    } catch (err) {
      setScanning(false);
      setScanError('We couldn\'t identify your outfit automatically.');
    }
  };

  const handleConfirmAndSave = async () => {
    if (selectedMatchIds.length === 0) {
      alert('Please confirm or select at least one clothing item.');
      return;
    }

    try {
      setSaving(true);
      const res = await recordWear({
        itemIds: selectedMatchIds,
        source: 'ai',
        imageUrl: scanResult.imageUrl,
        override: true,
      });

      setSavedSuccess(true);
      setSaving(false);

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setSaving(false);
      alert('Failed to save wear record.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-sand-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
          <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
          <span>AI Outfit Scanner</span>
        </span>
      </div>

      {/* Main Scan Card */}
      <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-sand-900">
            📸 Scan Today's Outfit
          </h1>
          <p className="text-xs text-sand-500 mt-1">
            Take or upload a photo of what you're wearing today. AI vision will match it with your saved wardrobe.
          </p>
        </div>

        {/* Saved Success Toast */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>✓ Outfit saved to your wear history! Redirecting...</span>
          </div>
        )}

        {/* Image Preview & Upload Input */}
        <div>
          {imagePreview ? (
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-sand-100 border border-sand-300 overflow-hidden shadow-sm">
              <img src={imagePreview} alt="Outfit Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                  setScanResult(null);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 bg-sand-900/80 hover:bg-sand-900 text-white rounded-full text-xs font-bold backdrop-blur-sm"
              >
                Change Photo
              </button>
            </div>
          ) : (
            <label className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-sand-300 hover:border-slate-800 bg-sand-50 hover:bg-sand-100/50 flex flex-col items-center justify-center cursor-pointer transition-all p-6 text-center">
              <div className="p-4 bg-white rounded-full shadow-md text-slate-800 mb-3">
                <Camera className="h-8 w-8" />
              </div>
              <span className="text-base font-extrabold text-sand-900">
                Snap or Upload Outfit Photo
              </span>
              <span className="text-xs text-sand-400 mt-1">Supports camera on mobile devices</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Scan Action Button */}
        {imagePreview && !scanResult && !scanning && (
          <button
            onClick={handleRunScan}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Analyze Outfit with AI</span>
          </button>
        )}

        {/* Loading Scanning State */}
        {scanning && (
          <div className="py-12 text-center space-y-3 bg-sand-50 rounded-2xl border border-sand-200">
            <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-extrabold text-sm text-sand-900">Analyzing your outfit...</h3>
            <p className="text-xs text-sand-500">Detecting clothing categories, colors, and matching wardrobe</p>
          </div>
        )}

        {/* AI Failure Handling */}
        {scanError && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <span>{scanError}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-rose-300 text-rose-900 font-bold text-xs shadow-xs"
              >
                Choose from Wardrobe
              </button>
              <button
                onClick={handleRunScan}
                className="flex-1 py-2.5 rounded-xl bg-rose-900 text-white font-bold text-xs shadow-xs"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* AI SCAN MATCHING RESULTS & USER CONFIRMATION SCREEN */}
        {scanResult && scanResult.matches && (
          <div className="space-y-6 pt-2 border-t border-sand-200 animate-fadeIn">
            {scanResult.isFallback && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                ℹ️ {scanResult.message || 'AI scanner active in Heuristic Mode.'}
              </div>
            )}

            <div>
              <h2 className="text-lg font-extrabold text-sand-900">Is this what you're wearing?</h2>
              <p className="text-xs text-sand-500 mt-0.5">
                Review the AI detected wardrobe matches before saving to history.
              </p>
            </div>

            {/* List Matched Wardrobe Items */}
            <div className="space-y-4">
              {scanResult.matches.map((match, idx) => {
                const item = match.matchedItem;
                const isSelected = item && selectedMatchIds.includes(item._id);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      item && isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-sand-50 text-sand-900 border-sand-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={isSelected ? 'primary' : 'neutral'}
                            className={isSelected ? 'bg-white/20 text-white border-white/30' : ''}
                          >
                            {match.visualMatch ? '👁 Visual Match' : `Detected: ${match.detectedCategory} (${match.detectedColor})`}
                          </Badge>
                          {match.visualMatch && (
                            <Badge variant="accent" className="text-[10px]">
                              <Sparkles className="h-2.5 w-2.5 inline mr-0.5" />AI Confirmed
                            </Badge>
                          )}
                        </div>

                      {item && (
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {item.matchConfidence || 92}% match
                        </span>
                      )}
                    </div>

                    {item ? (
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-14 object-cover rounded-xl border border-white/20"
                          />
                          <div>
                            <h4 className="font-extrabold text-sm">{item.name}</h4>
                            <p
                              className={`text-xs capitalize font-medium ${
                                isSelected ? 'text-sand-300' : 'text-sand-500'
                              }`}
                            >
                              {item.category} · {item.color}
                            </p>
                            {match.visualMatch && match.reason && (
                              <p className={`text-[10px] mt-0.5 italic ${isSelected ? 'text-amber-300' : 'text-sand-400'}`}>
                                💬 {match.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMatchIds((prev) =>
                              prev.includes(item._id)
                                ? prev.filter((id) => id !== item._id)
                                : [...prev, item._id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </button>
                      </div>
                    ) : (
                      /* Low confidence / Unmatched fallback */
                      <div className="py-2 text-xs">
                        <p className="text-amber-800 font-bold">
                          ⚠️ Low confidence: Could not automatically pinpoint exact match.
                        </p>
                        {match.candidates && match.candidates.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[11px] font-semibold text-sand-500">
                              Possible Matches:
                            </span>
                            {match.candidates.map((cand) => (
                              <button
                                key={cand._id}
                                onClick={() => {
                                  setSelectedMatchIds((prev) => [...prev, cand._id]);
                                }}
                                className="w-full text-left p-2 rounded-xl bg-white border border-sand-200 text-xs font-bold text-sand-800 hover:bg-sand-100 flex items-center justify-between"
                              >
                                <span>{cand.name}</span>
                                <span className="text-[10px] font-semibold text-sand-500">
                                  {cand.matchConfidence}%
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-sand-100">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-sand-300 text-sand-700 text-xs font-bold hover:bg-sand-100 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Selection</span>
              </button>

              <button
                type="button"
                disabled={saving || selectedMatchIds.length === 0}
                onClick={handleConfirmAndSave}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>✓ Yes, Save Outfit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Selection Fallback Modal */}
      <WearTrackerModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        initialSelectedIds={selectedMatchIds}
        onWearSaved={() => navigate('/')}
      />
    </div>
  );
};
