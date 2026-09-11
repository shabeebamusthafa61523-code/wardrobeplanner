import React, { useState } from "react";
import { X, LogIn, UserPlus, CheckCircle2, LogOut } from "lucide-react";
import { registerUser, loginUser, logoutUser, isLoggedIn } from "../services/api";

export const UserAuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const currentUserName = localStorage.getItem("wardrobe_user_name") || "";
  const currentUserRole = localStorage.getItem("wardrobe_user_role") || "user";
  const loggedIn = isLoggedIn();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!name.trim() || !password) { setErrorMsg("Please enter your name and password."); return; }
    const cleanName = name.toLowerCase().trim();
    try {
      setLoading(true);
      const res = mode === "register"
        ? await registerUser({ name: cleanName, password })
        : await loginUser({ name: cleanName, password });
      setSuccessMsg(res.message || "✓ Signed in successfully!");
      setLoading(false);
      setTimeout(() => { onAuthSuccess && onAuthSuccess(res.user); handleClose(); }, 1000);
    } catch (err) {
      setLoading(false);
      const serverErr = err.response?.data?.error;
      if (serverErr) setErrorMsg(serverErr);
      else if (err.code === "ERR_NETWORK" || !err.response) setErrorMsg("Network error: Connecting to server...");
      else setErrorMsg("Authentication failed. Please verify your name and password or Register a new account.");
    }
  };

  const handleSignOut = () => { logoutUser(); onClose(); window.location.reload(); };

  const handleClose = () => { setName(""); setPassword(""); setErrorMsg(""); setSuccessMsg(""); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-sand-200 flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-100 flex items-center justify-between bg-sand-50">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
            <h2 className="text-lg font-bold text-sand-900">
              {loggedIn ? "My Account" : mode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full text-sand-400 hover:text-sand-800 hover:bg-sand-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── LOGGED IN ── */}
        {loggedIn ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
                {currentUserName[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-xs font-bold text-sand-400 uppercase tracking-widest">Signed in as</p>
                <p className="text-xl font-extrabold text-sand-900 capitalize mt-0.5">{currentUserName}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  currentUserRole === "superadmin"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-sand-100 text-sand-600 border border-sand-200"
                }`}>
                  {currentUserRole === "superadmin" ? "👑 Superadmin" : "User"}
                </span>
              </div>
            </div>

            <div className="border-t border-sand-100 pt-4 space-y-2">
              <p className="text-xs text-sand-500 font-medium text-center">
                To switch accounts, sign out first then log in with a different account.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-sm transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-2xl border border-sand-200 text-sand-600 font-semibold text-sm hover:bg-sand-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

        ) : (
          /* ── LOGIN / REGISTER FORM ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">⚠️ {errorMsg}</div>
            )}
            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /><span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-sand-700 uppercase tracking-wider mb-1">Your Name</label>
              <input type="text" placeholder="e.g. shabeeba, rahul, priya" value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm font-medium lowercase" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sand-700 uppercase tracking-wider mb-1">Password</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-slate-800 text-sm font-medium" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : mode === "login" ? <><LogIn className="h-4 w-4" /><span>Sign In</span></>
                : <><UserPlus className="h-4 w-4" /><span>Create Account</span></>}
            </button>

            <div className="pt-3 border-t border-sand-100 text-center text-xs text-sand-500 font-semibold">
              {mode === "login" ? (
                <p>Don't have an account?{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-slate-900 font-extrabold hover:underline">Register Here</button>
                </p>
              ) : (
                <p>Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-slate-900 font-extrabold hover:underline">Sign In Here</button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
