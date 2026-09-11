import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon, Plus, Trash2, AlertTriangle, Sparkles, Shirt,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, RotateCcw, Bookmark,
} from "lucide-react";
import {
  fetchWeeklyPlanner, updatePlannerDay, removePlannerDay, fetchWearHistory,
} from "../services/api";
import { WearTrackerModal } from "../components/WearTrackerModal";
import { Badge } from "../components/Badge";

const DAYS_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper: Get Monday date for any given date
const getMondayOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export const WeeklyPlanner = () => {
  const [activeTab, setActiveTab] = useState("weekly"); // "weekly" | "monthly"
  const [plannerData, setPlannerData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null); // { dayName, dateKey, dateFormatted }
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  // Week selection state (defaults to Monday of current week)
  const [currentWeekMonday, setCurrentWeekMonday] = useState(getMondayOfWeek(new Date()));

  // Monthly Calendar state
  const [viewMonthDate, setViewMonthDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null); // { dateObj, dateKey, dateFormatted, dayName }

  useEffect(() => {
    loadPlanner();
    loadHistory();
  }, []);

  const loadPlanner = async () => {
    try {
      setLoading(true);
      const res = await fetchWeeklyPlanner();
      setPlannerData(res.data || {});
      setLoading(false);
    } catch (err) {
      console.error("Error fetching weekly planner:", err);
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetchWearHistory();
      setHistoryData(res.data || []);
    } catch (err) {
      console.error("Error fetching wear history for calendar:", err);
    }
  };

  const handleOpenSelect = (dayInfo) => {
    setSelectedDayInfo(dayInfo);
    setIsSelectModalOpen(true);
  };

  const handleOutfitSelected = async (outfitData) => {
    if (!selectedDayInfo || !outfitData) return;
    try {
      const itemIds = outfitData.itemIds ? outfitData.itemIds.map((i) => i._id || i) : [];
      await updatePlannerDay({
        day: selectedDayInfo.dayName,
        date: selectedDayInfo.dateKey,
        itemIds,
      });
      loadPlanner();
    } catch (err) {
      console.error("Error updating planner day outfit:", err);
    }
  };

  const handleClearDay = async (dayInfo, e) => {
    if (e) e.stopPropagation();
    try {
      await removePlannerDay(dayInfo.dateKey || dayInfo.dayName);
      loadPlanner();
      if (selectedCalendarDay && selectedCalendarDay.dateKey === dayInfo.dateKey) {
        setSelectedCalendarDay(null);
      }
    } catch (err) {
      console.error("Error removing planner outfit:", err);
    }
  };

  /* ─── Week Selection Helpers ─── */
  const prevWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() - 7);
    setCurrentWeekMonday(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + 7);
    setCurrentWeekMonday(d);
  };

  const resetToThisWeek = () => {
    setCurrentWeekMonday(getMondayOfWeek(new Date()));
  };

  const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayKey = formatDateKey(new Date());

  // Generate Mon-Sat days for selected week
  const getSelectedWeekDays = () => {
    return DAYS_NAMES.map((dayName, idx) => {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + idx);
      const dateKey = formatDateKey(d);
      return {
        dayName,
        dateObj: d,
        dateKey,
        dateFormatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        isToday: dateKey === todayKey,
      };
    });
  };

  // Week range label (e.g. "Sep 7 – Sep 12, 2026")
  const saturdayDate = new Date(currentWeekMonday);
  saturdayDate.setDate(currentWeekMonday.getDate() + 5);
  const weekRangeLabel = `${currentWeekMonday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${saturdayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  /* ─── Monthly Calendar Helpers ─── */
  const year = viewMonthDate.getFullYear();
  const month = viewMonthDate.getMonth();

  const prevMonth = () => setViewMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonthDate(new Date(year, month + 1, 1));
  const resetToTodayMonth = () => setViewMonthDate(new Date());

  const getCalendarCells = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      cells.push({ date: dateObj, isCurrentMonth: true });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        cells.push({ date: d, isCurrentMonth: false });
      }
    }

    return cells;
  };

  // Index history records by YYYY-MM-DD
  const historyByDate = {};
  historyData.forEach((rec) => {
    if (rec.date) {
      if (!historyByDate[rec.date]) historyByDate[rec.date] = [];
      historyByDate[rec.date].push(rec);
    }
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-7 w-7 text-slate-800" />
            <span>Wardrobe Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-sand-500 mt-1">
            Plan your outfits for the week or review your monthly outfit calendar.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-sand-200/70 p-1.5 rounded-2xl border border-sand-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "weekly"
                ? "bg-white text-slate-900 shadow-sm border border-sand-200"
                : "text-sand-600 hover:text-sand-900"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Weekly Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "monthly"
                ? "bg-white text-slate-900 shadow-sm border border-sand-200"
                : "text-sand-600 hover:text-sand-900"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Monthly Calendar</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: WEEKLY WORK PLANNER WITH WEEK SELECTOR & DATES ─── */}
      {activeTab === "weekly" && (
        <div className="space-y-5">
          {/* Week Selector Bar */}
          <div className="bg-white p-4 rounded-3xl border border-sand-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={prevWeek}
              className="p-2.5 rounded-xl border border-sand-200 hover:bg-sand-100 text-sand-700 font-bold text-xs flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev Week</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-xs font-bold text-sand-400 uppercase tracking-widest block">
                  Selected Week
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-sand-900">
                  {weekRangeLabel}
                </h2>
              </div>
              <button
                onClick={resetToThisWeek}
                className="px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-800 text-xs font-bold transition-all border border-sand-200 flex items-center gap-1"
                title="Jump to current week"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>This Week</span>
              </button>
            </div>

            <button
              onClick={nextWeek}
              className="p-2.5 rounded-xl border border-sand-200 hover:bg-sand-100 text-sand-700 font-bold text-xs flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
            >
              <span>Next Week</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grid of Mon-Sat Cards for Selected Week */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-sand-400">
              <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold">Loading planner schedule...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {getSelectedWeekDays().map((dayInfo) => {
                // Check if outfit is saved under dateKey
                const outfit = plannerData[dayInfo.dateKey];
                return (
                  <div
                    key={dayInfo.dateKey}
                    className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      dayInfo.isToday ? "border-slate-900 ring-2 ring-slate-900/10" : "border-sand-200"
                    }`}
                  >
                    {/* Day & Date Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-sand-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sand-900 text-base">
                            {dayInfo.dayName}
                          </span>
                          {dayInfo.isToday && (
                            <Badge variant="primary" className="bg-slate-900 text-white text-[10px]">
                              Today
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-sand-500 block mt-0.5">
                          {dayInfo.dateFormatted}
                        </span>
                      </div>
                      {outfit && (
                        <button
                          onClick={(e) => handleClearDay(dayInfo, e)}
                          className="p-1 text-sand-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Clear Day"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Day Content */}
                    <div className="py-4">
                      {outfit ? (
                        <div className="space-y-3">
                          {/* Items Combination */}
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-sand-100 overflow-hidden border border-sand-200 flex-shrink-0">
                              <img
                                src={outfit.itemIds[0]?.imageUrl}
                                alt="Outfit"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80";
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-sand-900 leading-snug">
                                {outfit.itemIds.map((i) => i.name).join(" + ")}
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {outfit.itemIds.map((item) => (
                                  <Badge key={item._id} variant="neutral" className="text-[10px]">
                                    {item.category}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Repeat Warning Alert */}
                          {outfit.hasRepeatWarning && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                              <span>{outfit.warningMessage}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => handleOpenSelect(dayInfo)}
                          className="py-8 px-4 rounded-2xl border-2 border-dashed border-sand-200 hover:border-slate-800 bg-sand-50/50 hover:bg-sand-100/50 cursor-pointer flex flex-col items-center justify-center text-center transition-all group"
                        >
                          <div className="h-9 w-9 rounded-full bg-white border border-sand-300 text-sand-700 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center mb-2">
                            <Plus className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-bold text-sand-700">Add Outfit</span>
                        </div>
                      )}
                    </div>

                    {/* Day Footer Action */}
                    {outfit && (
                      <button
                        onClick={() => handleOpenSelect(dayInfo)}
                        className="w-full py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-800 text-xs font-bold transition-colors"
                      >
                        Change Outfit
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: MONTHLY CALENDAR (SHOWS WORN & PLANNED OUTFITS BY DATE) ─── */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          {/* Month Navigation Controls */}
          <div className="bg-white p-4 rounded-3xl border border-sand-200 shadow-sm flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-sand-200 hover:bg-sand-100 text-sand-700 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev Month</span>
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-sand-900">
                {viewMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <button
                onClick={resetToTodayMonth}
                className="px-3 py-1 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-800 text-xs font-bold transition-all border border-sand-200"
              >
                Today
              </button>
            </div>

            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-sand-200 hover:bg-sand-100 text-sand-700 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <span className="hidden sm:inline">Next Month</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-3xl border border-sand-200 p-3 sm:p-5 shadow-sm overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {WEEKDAYS_SHORT.map((wd) => (
                <div key={wd} className="py-1 text-[11px] font-extrabold text-sand-400 uppercase tracking-wider">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {getCalendarCells().map(({ date: cellDate, isCurrentMonth }, idx) => {
                const dateKey = formatDateKey(cellDate);
                const isToday = dateKey === todayKey;
                const recordsForDay = historyByDate[dateKey] || [];
                const plannedForDay = plannerData[dateKey] || null;

                const dayName = cellDate.toLocaleDateString("en-US", { weekday: "long" });
                const dateFormatted = cellDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const dayInfo = { dayName, dateKey, dateFormatted, dateObj: cellDate };

                const hasWorn = recordsForDay.length > 0;
                const hasPlanned = !!plannedForDay;

                // Pick display items (worn take priority over planned for thumbnails)
                const itemsToDisplay = hasWorn
                  ? recordsForDay.flatMap((rec) => rec.itemIds || [])
                  : hasPlanned
                  ? plannedForDay.itemIds || []
                  : [];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isCurrentMonth) {
                        setSelectedCalendarDay({ ...dayInfo, records: recordsForDay, planned: plannedForDay });
                      }
                    }}
                    className={`min-h-[80px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                      isToday
                        ? "bg-slate-900/5 border-slate-900 ring-2 ring-slate-900/20"
                        : isCurrentMonth
                        ? "bg-white border-sand-200 hover:border-sand-400"
                        : "bg-sand-50/50 border-sand-100 opacity-40"
                    } ${isCurrentMonth ? "cursor-pointer hover:shadow-md" : ""}`}
                  >
                    {/* Top Row: Date Number & Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full ${
                          isToday
                            ? "bg-slate-900 text-white"
                            : isCurrentMonth
                            ? "text-sand-800"
                            : "text-sand-400"
                        }`}
                      >
                        {cellDate.getDate()}
                      </span>
                      {hasWorn ? (
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          ✓ Worn
                        </span>
                      ) : hasPlanned ? (
                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          📌 Planned
                        </span>
                      ) : null}
                    </div>

                    {/* Middle: Clothing Thumbnails */}
                    <div className="my-1 flex items-center justify-center -space-x-2 overflow-hidden">
                      {itemsToDisplay.slice(0, 3).map((item, itemIdx) => (
                        <img
                          key={itemIdx}
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-7 h-8 sm:w-8 sm:h-10 object-cover rounded-lg border-2 border-white shadow-xs"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ))}
                    </div>

                    {/* Bottom: Subtitle / Prompt */}
                    <div className="text-center">
                      {hasWorn || hasPlanned ? (
                        <span className="text-[9px] font-bold text-sand-500 block truncate">
                          Tap details
                        </span>
                      ) : isCurrentMonth ? (
                        <span className="text-[9px] text-sand-300 font-semibold block">
                          + Plan
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Select Outfit for Weekly Planner ─── */}
      <WearTrackerModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onWearSaved={handleOutfitSelected}
        isPlannerMode={true}
        title={selectedDayInfo ? `Plan Outfit for ${selectedDayInfo.dayName} (${selectedDayInfo.dateFormatted})` : "Plan Outfit"}
        submitLabel={selectedDayInfo ? `Save for ${selectedDayInfo.dayName}` : "Save Outfit"}
      />

      {/* ─── MODAL 2: Day Outfit Detail Modal for Monthly Calendar ─── */}
      {selectedCalendarDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-sand-200 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sand-900 text-base flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-slate-800" />
                  <span>{selectedCalendarDay.dayName}</span>
                </h3>
                <p className="text-xs text-sand-500 font-medium">
                  {selectedCalendarDay.dateFormatted}
                </p>
              </div>
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="text-sand-400 hover:text-sand-800 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Recorded Worn Outfits */}
              {selectedCalendarDay.records && selectedCalendarDay.records.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    ✓ Recorded Wear History
                  </span>
                  {selectedCalendarDay.records.map((rec, idx) => (
                    <div key={rec._id || idx} className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Worn Outfit #{idx + 1}</span>
                        <Badge variant={rec.source === "ai" ? "accent" : "neutral"} className="text-[10px]">
                          {rec.source === "ai" ? "📸 AI Scan" : "Manual"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {rec.itemIds?.map((item) => (
                          <div key={item._id} className="flex flex-col items-center gap-1 w-16">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-14 h-16 object-cover rounded-xl border border-sand-300 shadow-xs"
                            />
                            <span className="text-[9px] font-bold text-sand-700 truncate w-full text-center">
                              {item.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Planned Outfit for Date */}
              {selectedCalendarDay.planned && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      📌 Planned Outfit
                    </span>
                    <button
                      onClick={() => handleClearDay(selectedCalendarDay)}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove Plan
                    </button>
                  </div>
                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCalendarDay.planned.itemIds?.map((item) => (
                        <div key={item._id} className="flex flex-col items-center gap-1 w-16">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-14 h-16 object-cover rounded-xl border border-sand-300 shadow-xs"
                          />
                          <span className="text-[9px] font-bold text-sand-700 truncate w-full text-center">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(!selectedCalendarDay.records || selectedCalendarDay.records.length === 0) && !selectedCalendarDay.planned && (
                <div className="text-center py-6 bg-sand-50 rounded-2xl border border-dashed border-sand-200">
                  <p className="text-sand-600 text-xs font-semibold">No outfits recorded or planned for this date.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  const dayInfo = selectedCalendarDay;
                  setSelectedCalendarDay(null);
                  handleOpenSelect(dayInfo);
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>{selectedCalendarDay.planned ? "Change Planned Outfit" : "Plan Outfit for this Date"}</span>
              </button>
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="w-full py-2.5 rounded-2xl border border-sand-200 text-sand-600 font-semibold text-xs hover:bg-sand-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
