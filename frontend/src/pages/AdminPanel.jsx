import React, { useState, useEffect } from "react";
import {
  Shield, Shirt, History as HistoryIcon, Trash2,
  ChevronLeft, Crown, Calendar, KeyRound, Eye, EyeOff,
  CheckCircle2, AlertTriangle, UserCircle2,
} from "lucide-react";
import {
  adminGetUsers, adminGetUserWardrobe, adminGetUserHistory,
  adminDeleteUser, adminUpdateUserRole, adminResetUserPassword,
} from "../services/api";
import { Badge } from "../components/Badge";

export const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab] = useState("credentials"); // credentials | wardrobe | history
  const [userItems, setUserItems] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { type: 'success'|'error', text }
  const [resetting, setResetting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminGetUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error("Admin: failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const openUser = async (user) => {
    setSelectedUser(user);
    setTab("credentials");
    setNewPassword("");
    setShowPassword(false);
    setResetMsg(null);
  };

  const loadUserData = async (userId, activeTab) => {
    if (activeTab === "wardrobe") {
      setDetailLoading(true);
      try { const res = await adminGetUserWardrobe(userId); setUserItems(res.data || []); }
      catch (err) { console.error(err); } finally { setDetailLoading(false); }
    } else if (activeTab === "history") {
      setDetailLoading(true);
      try { const res = await adminGetUserHistory(userId); setUserHistory(res.data || []); }
      catch (err) { console.error(err); } finally { setDetailLoading(false); }
    }
  };

  const switchTab = async (t) => {
    setTab(t);
    setResetMsg(null);
    if (t !== "credentials") await loadUserData(selectedUser._id, t);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and ALL their data permanently?")) return;
    try {
      await adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      if (selectedUser?._id === userId) setSelectedUser(null);
    } catch { alert("Failed to delete user."); }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === "superadmin" ? "user" : "superadmin";
    if (!window.confirm(`Change "${user.name}" to ${newRole}?`)) return;
    try {
      await adminUpdateUserRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, role: newRole } : u));
      if (selectedUser?._id === user._id) setSelectedUser((prev) => ({ ...prev, role: newRole }));
    } catch { alert("Failed to update role."); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await adminResetUserPassword(selectedUser._id, newPassword);
      setResetMsg({ type: "success", text: res.message || "✓ Password reset." });
      setNewPassword("");
    } catch (err) {
      setResetMsg({ type: "error", text: err.response?.data?.error || "Failed to reset password." });
    } finally {
      setResetting(false);
    }
  };

  /* ─── User Detail View ─── */
  if (selectedUser) {
    const tabs = [
      { key: "credentials", label: "Credentials", icon: UserCircle2 },
      { key: "wardrobe",    label: "Wardrobe",    icon: Shirt },
      { key: "history",     label: "History",     icon: HistoryIcon },
    ];

    return (
      <div className="space-y-5 animate-fadeIn pb-12">
        {/* Back */}
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-sand-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" /> All Users
        </button>

        {/* User card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white rounded-3xl border border-sand-200 p-5 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            {selectedUser.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-sand-900 capitalize">{selectedUser.name}</h2>
              {selectedUser.role === "superadmin"
                ? <Badge variant="accent"><Crown className="h-3 w-3 inline mr-1" />Superadmin</Badge>
                : <Badge variant="neutral">User</Badge>}
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-xs font-bold text-sand-500">{selectedUser.itemCount} items</span>
              <span className="text-xs font-bold text-sand-500">{selectedUser.outfitCount} outfits</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => handleRoleToggle(selectedUser)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-sand-300 hover:bg-sand-100 text-sand-800 transition-all"
            >
              {selectedUser.role === "superadmin" ? "Demote to User" : "Make Superadmin"}
            </button>
            <button
              onClick={() => handleDeleteUser(selectedUser._id)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-sand-100 p-1.5 rounded-2xl w-fit border border-sand-200">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === key ? "bg-white text-slate-900 shadow-sm border border-sand-200" : "text-sand-600 hover:text-sand-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── CREDENTIALS TAB ── */}
        {tab === "credentials" && (
          <div className="space-y-4">
            {/* Info card */}
            <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-sand-900 uppercase tracking-wider">Account Info</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="bg-sand-50 rounded-2xl border border-sand-200 p-4">
                  <p className="text-[10px] font-bold text-sand-400 uppercase tracking-widest mb-1">Username</p>
                  <p className="text-lg font-extrabold text-slate-900 capitalize">{selectedUser.name}</p>
                </div>

                {/* Role */}
                <div className="bg-sand-50 rounded-2xl border border-sand-200 p-4">
                  <p className="text-[10px] font-bold text-sand-400 uppercase tracking-widest mb-1">Role</p>
                  <p className="text-lg font-extrabold text-slate-900 capitalize">{selectedUser.role}</p>
                </div>

                {/* Joined */}
                <div className="bg-sand-50 rounded-2xl border border-sand-200 p-4">
                  <p className="text-[10px] font-bold text-sand-400 uppercase tracking-widest mb-1">Joined</p>
                  <p className="text-sm font-bold text-sand-800">
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Last Updated */}
                <div className="bg-sand-50 rounded-2xl border border-sand-200 p-4">
                  <p className="text-[10px] font-bold text-sand-400 uppercase tracking-widest mb-1">Last Updated</p>
                  <p className="text-sm font-bold text-sand-800">
                    {new Date(selectedUser.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Password note */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 sm:col-span-2">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Password</p>
                  <p className="text-xs font-semibold text-amber-800">
                    🔒 Stored as a secure hash — cannot be viewed. Use the form below to reset it.
                  </p>
                </div>
              </div>
            </div>

            {/* Reset password form */}
            <div className="bg-white rounded-3xl border border-sand-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound className="h-4 w-4 text-slate-700" />
                <h3 className="text-sm font-extrabold text-sand-900 uppercase tracking-wider">Reset Password</h3>
              </div>

              {resetMsg && (
                <div className={`mb-4 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold ${
                  resetMsg.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}>
                  {resetMsg.type === "success"
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />}
                  {resetMsg.text}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-800"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={resetting || !newPassword.trim()}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                >
                  {resetting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</>
                  ) : (
                    <><KeyRound className="h-4 w-4" /> Reset Password</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── WARDROBE / HISTORY TABS ── */}
        {tab !== "credentials" && (
          detailLoading ? (
            <div className="py-16 flex flex-col items-center text-sand-400">
              <div className="w-7 h-7 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading...</p>
            </div>
          ) : tab === "wardrobe" ? (
            userItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-sand-300">
                <p className="text-sand-500 text-sm font-semibold">No wardrobe items yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {userItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-square bg-sand-100 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt className="h-10 w-10 text-sand-300" />
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-sand-400 uppercase tracking-wide">{item.category}</p>
                      <p className="text-xs font-extrabold text-sand-900 truncate mt-0.5">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            userHistory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-sand-300">
                <p className="text-sand-500 text-sm font-semibold">No outfit history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userHistory.map((outfit) => (
                  <div key={outfit._id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-3.5 w-3.5 text-sand-400" />
                      <span className="text-xs font-extrabold text-sand-700">{outfit.date}</span>
                      <Badge variant={outfit.source === "ai" ? "accent" : "neutral"} className="ml-auto text-[10px]">
                        {outfit.source === "ai" ? "📸 AI" : "Manual"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      {outfit.itemIds?.map((item, idx) => (
                        <React.Fragment key={item._id}>
                          {idx > 0 && <span className="text-base font-black text-sand-300 self-center pb-5">+</span>}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="w-16 h-20 rounded-xl overflow-hidden bg-sand-100 border-2 border-sand-200 shadow-sm flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <Shirt className="h-6 w-6 text-sand-300" />
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-sand-500 text-center truncate w-full">{item.category}</span>
                            <span className="text-[10px] font-extrabold text-sand-800 text-center truncate w-full">{item.name}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    );
  }

  /* ─── Users List View ─── */
  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-amber-300" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-sand-900 tracking-tight">Superadmin Panel</h1>
          <p className="text-xs text-sand-500 mt-0.5">Manage all users, credentials, wardrobes and history.</p>
        </div>
        <div className="ml-auto">
          <Badge variant="accent"><Crown className="h-3 w-3 inline mr-1" />Superadmin</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-slate-900">{users.length}</p>
          <p className="text-xs font-bold text-sand-500 mt-1 uppercase tracking-wider">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-slate-900">{users.reduce((s, u) => s + (u.itemCount || 0), 0)}</p>
          <p className="text-xs font-bold text-sand-500 mt-1 uppercase tracking-wider">Total Items</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-extrabold text-slate-900">{users.reduce((s, u) => s + (u.outfitCount || 0), 0)}</p>
          <p className="text-xs font-bold text-sand-500 mt-1 uppercase tracking-wider">Total Outfits</p>
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="py-20 flex flex-col items-center text-sand-400">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-sand-300">
          <p className="text-sand-500 text-sm font-semibold">No registered users yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => openUser(user)}
              className="bg-white rounded-2xl border border-sand-200 p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg font-extrabold flex-shrink-0 group-hover:bg-slate-800 transition-colors">
                {user.name[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sand-900 capitalize text-sm">{user.name}</span>
                  {user.role === "superadmin" && (
                    <Badge variant="accent" className="text-[10px]"><Crown className="h-2.5 w-2.5 inline mr-0.5" />Admin</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-[11px] font-semibold text-sand-500 flex items-center gap-1">
                    <Shirt className="h-3 w-3" /> {user.itemCount} items
                  </span>
                  <span className="text-[11px] font-semibold text-sand-500 flex items-center gap-1">
                    <HistoryIcon className="h-3 w-3" /> {user.outfitCount} outfits
                  </span>
                  <span className="text-[11px] font-semibold text-sand-400">
                    Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleRoleToggle(user)}
                  title={user.role === "superadmin" ? "Demote to User" : "Make Superadmin"}
                  className="p-2 rounded-xl border border-sand-200 hover:bg-sand-100 text-sand-600 hover:text-slate-900 transition-all"
                >
                  <Crown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user._id)}
                  title="Delete user"
                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
