import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

export const SplashScreen = ({
  desktopVideo = '/splash.mp4',
  mobileVideo = '/splashmb.mp4',
  onComplete,
}) => {
  const [fadingOut, setFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentVideoSrc = isMobile ? mobileVideo : desktopVideo;

  useEffect(() => {
    // Attempt autoplay
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay policy prevented playback or file missing
        setVideoError(true);
      });
    }

    // Auto-dismiss after 6 seconds max if video is stuck or long
    const maxTimer = setTimeout(() => {
      handleFinish();
    }, 6000);

    return () => clearTimeout(maxTimer);
  }, [currentVideoSrc]);

  const handleFinish = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete && onComplete();
    }, 500); // 500ms fade transition
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col justify-between overflow-hidden transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Video */}
      {!videoError ? (
        <video
          ref={videoRef}
          key={currentVideoSrc}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleFinish}
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src={mobileVideo} media="(max-width: 767px)" type="video/mp4" />
          <source src={desktopVideo} media="(min-width: 768px)" type="video/mp4" />
        </video>
      ) : (
        /* Fallback Animated Gradient & Logo if video file not yet added */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-6 text-center z-0">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center animate-pulse">
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg logo-theme-aware" />
            </div>
            <div className="absolute -inset-2 bg-amber-400/20 rounded-3xl filter blur-xl -z-10 animate-ping opacity-30" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            WARDROBE
          </h1>
          <p className="text-xs sm:text-sm font-medium text-amber-300/80 uppercase tracking-widest">
            Personal Outfit Planner
          </p>
        </div>
      )}

      {/* Dark overlay gradient for readable controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/60 z-10 pointer-events-none" />

      {/* Top Bar Controls */}
      <div className="relative z-20 p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain logo-theme-aware" />
          <span className="font-extrabold text-sm tracking-wider uppercase text-sand-100">Wardrobe</span>
        </div>

        <div className="flex items-center gap-3">
          {!videoError && (
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={handleFinish}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 shadow-md"
          >
            <span>Skip</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Branding / Progress Footer */}
      <div className="relative z-20 p-6 sm:p-8 flex flex-col items-center text-center space-y-3">
        <p className="text-xs font-semibold text-sand-300/80 tracking-widest uppercase">
          Elevate Your Daily Style
        </p>
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
};
