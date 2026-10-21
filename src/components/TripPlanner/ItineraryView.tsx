import React, { useState } from 'react';
import { TripPlan, PackingItem } from '../../types/travel';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  ShieldCheck,
  CloudSun,
  CheckSquare,
  Square,
  Printer,
  Bookmark,
  Share2,
  Globe,
  Sparkles,
  Luggage,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';

interface ItineraryViewProps {
  trip: TripPlan;
  onFocusGlobe: () => void;
  onSaveTrip: (trip: TripPlan) => void;
  isSaved?: boolean;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  onFocusGlobe,
  onSaveTrip,
  isSaved = false,
}) => {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [packingList, setPackingList] = useState<PackingItem[]>(trip.packingList || []);
  const [newPackingItem, setNewPackingItem] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [expandedAllDays, setExpandedAllDays] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Text-To-Speech SpeechSynthesis narration
  const handleToggleSpeech = () => {
    sound.playClick();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentDayData = trip.days.find(d => d.dayNumber === activeDay) || trip.days[0];
    const speechText = `Welcome to your adventure in ${trip.destination.name}! On Day ${currentDayData.dayNumber}, ${currentDayData.theme}. In the morning, you will ${currentDayData.activities[0]?.title}. In the afternoon, ${currentDayData.activities[1]?.title}. In the evening, ${currentDayData.activities[2]?.title}. Have an amazing trip!`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Cheerful friendly voice pitch
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Toggle packing checklist item with confetti
  const togglePackingItem = (id: string) => {
    sound.playClick();
    setPackingList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextPacked = !item.packed;
          if (nextPacked) {
            try {
              confetti({
                particleCount: 25,
                spread: 45,
                origin: { y: 0.8 }
              });
            } catch {
              // safe fallback
            }
          }
          return { ...item, packed: nextPacked };
        }
        return item;
      })
    );
  };

  // Add custom item
  const handleAddPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingItem.trim()) return;
    sound.playClick();
    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      item: newPackingItem.trim(),
      category: 'Essentials',
      packed: false,
    };
    setPackingList(prev => [...prev, newItem]);
    setNewPackingItem('');
  };

  // Print Report
  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  // Share summary
  const handleShare = () => {
    sound.playClick();
    const text = `✈️ ${trip.title}\n📍 ${trip.destination.name}, ${trip.destination.country}\n🗓️ ${trip.durationDays} Days | ${trip.travelStyle.toUpperCase()} Style\n💰 Total Estimated: ${trip.costBreakdown.currency} ${trip.costBreakdown.totalEstimatedCost.toLocaleString()}\n\nGenerated with AI Travel Intelligence Agent`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const packedCount = packingList.filter(i => i.packed).length;
  const packedPercent = packingList.length > 0 ? Math.round((packedCount / packingList.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {trip.destination.country}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 capitalize">
                {trip.travelStyle} Mode
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                {trip.budgetLevel} Tier
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {trip.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">{trip.overview}</p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{trip.durationDays} Days</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>From: {trip.origin.name.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>~{trip.flightIntelligence.directFlightHours}h Direct Flight ({trip.flightIntelligence.distanceKm.toLocaleString()} km)</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 w-full lg:w-auto no-print">
            <button
              onClick={handleToggleSpeech}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                isSpeaking
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isSpeaking ? 'Stop Reading' : '🔊 Read Trip Out Loud'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onFocusGlobe();
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              Focus on 3D Globe
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSaveTrip(trip);
              }}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
              {isSaved ? 'Saved to Library' : 'Save Itinerary'}
            </button>

            <button
              onClick={handleShare}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              {copiedShare ? 'Copied Summary!' : 'Share Trip'}
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              Print / Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Day Timeline on Left, Intelligence Widgets on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2): Day-by-Day Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day Navigation Tabs */}
          <div className="flex items-center justify-between no-print pb-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Day-by-Day Itinerary Schedule
            </h2>

            <button
              onClick={() => setExpandedAllDays(prev => !prev)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              {expandedAllDays ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Collapse Days
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> Expand All Days
                </>
              )}
            </button>
          </div>

          {/* Quick Day Picker Bar (When not in Expand All mode) */}
          {!expandedAllDays && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-print">
              {trip.days.map(d => (
                <button
                  key={d.dayNumber}
                  onClick={() => {
                    sound.playClick();
                    setActiveDay(d.dayNumber);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    activeDay === d.dayNumber
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/25'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  Day {d.dayNumber}
                </button>
              ))}
            </div>
          )}

          {/* Days Content */}
          <div className="space-y-6">
            {trip.days
              .filter(d => (expandedAllDays ? true : d.dayNumber === activeDay))
              .map(day => (
                <div
                  key={day.dayNumber}
                  className="itinerary-print-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
                >
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Day {day.dayNumber}
                      </div>
                      <h3 className="text-lg font-bold text-white">{day.theme}</h3>
                    </div>
                    {day.daySummary && (
                      <p className="text-xs text-slate-400 max-w-sm sm:text-right">{day.daySummary}</p>
                    )}
                  </div>

                  {/* Day Activities Timeline */}
                  <div className="space-y-4 pt-2">
                    {day.activities.map((activity, aIdx) => (
                      <div
                        key={activity.id || aIdx}
                        className="relative pl-6 border-l-2 border-slate-800 hover:border-cyan-500/60 transition-colors group"
                      >
                        {/* Timeline node */}
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 group-hover:scale-110 transition-transform" />

                        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                          {/* Activity Top Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {activity.timeSlot}
                              </span>
                              <span className="text-xs font-mono text-cyan-300 font-medium">
                                {activity.timeRange}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-emerald-400 font-semibold font-mono">
                                {activity.estimatedCost > 0
                                  ? `${trip.costBreakdown.currency} ${activity.estimatedCost}`
                                  : 'Free / Included'}
                              </span>
                            </div>
                          </div>

                          {/* Activity Title & Description */}
                          <h4 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {activity.title}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{activity.description}</p>

                          {/* Location & Tip */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] border-t border-slate-850">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="truncate">{activity.location}</span>
                            </div>

                            {activity.tips && (
                              <div className="flex items-center gap-1.5 text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded-md">
                                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>Tip: {activity.tips}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Intelligence Side-Widgets */}
        <div className="space-y-6">
          {/* 1. Cost Breakdown & Budget Optimizer */}
          <div className="itinerary-print-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Estimated Trip Budget
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Party'}
              </span>
            </div>

            <div className="text-center py-2 bg-slate-950/70 rounded-xl border border-slate-850">
              <div className="text-xs text-slate-400 uppercase font-semibold">Total Estimated Investment</div>
              <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                {trip.costBreakdown.currency} {trip.costBreakdown.totalEstimatedCost.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ~{trip.costBreakdown.currency} {Math.round(trip.costBreakdown.totalEstimatedCost / trip.travelers).toLocaleString()} / person
              </div>
            </div>

            {/* Breakdown Categories */}
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Flights & Long Transit', cost: trip.costBreakdown.flights, color: 'bg-cyan-500' },
                { label: 'Accommodations & Stays', cost: trip.costBreakdown.accommodation, color: 'bg-indigo-500' },
                { label: 'Dining & Culinary', cost: trip.costBreakdown.foodDining, color: 'bg-amber-500' },
                { label: 'Activities & Attractions', cost: trip.costBreakdown.activities, color: 'bg-rose-500' },
                { label: 'Local Transfers & Taxis', cost: trip.costBreakdown.localTransit, color: 'bg-purple-500' },
                { label: 'Emergency Buffer (8%)', cost: trip.costBreakdown.emergencyBuffer, color: 'bg-emerald-500' },
              ].map(item => {
                const percent = Math.round((item.cost / trip.costBreakdown.totalEstimatedCost) * 100) || 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>{item.label}</span>
                      <span className="font-mono font-medium">
                        {trip.costBreakdown.currency} {item.cost.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Live Weather Advisory */}
          <div className="itinerary-print-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-amber-400" />
              Destination Weather Advisory
            </h3>

            <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-850 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expected Temperature:</span>
                <span className="font-semibold text-white font-mono">{trip.weatherAdvisory.temperatureRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Season:</span>
                <span className="font-medium text-amber-300">{trip.weatherAdvisory.season}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rainfall Likelihood:</span>
                <span className="font-medium text-cyan-300">{trip.weatherAdvisory.rainLikelihood}</span>
              </div>
              <p className="text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                {trip.weatherAdvisory.conditionSummary}
              </p>
              <div className="p-2 rounded-lg bg-slate-900 text-[11px] text-slate-300 border border-slate-800">
                <span className="font-semibold text-cyan-400">Pack: </span>
                {trip.weatherAdvisory.whatToWear}
              </div>
            </div>
          </div>

          {/* 3. Smart Traveler Advisory */}
          <div className="itinerary-print-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Smart Travel Advisory
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Safety & Security</div>
                <div className="text-slate-200 mt-0.5">{trip.smartAdvisory.safetyIndex}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Visa & Entry Information</div>
                <div className="text-slate-200 mt-0.5">{trip.smartAdvisory.visaInfo}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tap Water</div>
                  <div className="text-slate-200 mt-0.5">{trip.smartAdvisory.tapWater}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tipping Standard</div>
                  <div className="text-slate-200 mt-0.5">{trip.smartAdvisory.tippingCulture}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Local Etiquette & Culture</div>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-300 text-[11px]">
                  {trip.smartAdvisory.localEtiquette.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4. Packing Checklist Widget */}
          <div className="itinerary-print-card bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Luggage className="w-4 h-4 text-purple-400" />
                Packing Checklist
              </h3>
              <span className="text-xs font-mono font-semibold text-purple-300">
                {packedCount}/{packingList.length} ({packedPercent}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${packedPercent}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {packingList.map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => togglePackingItem(item.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                    item.packed
                      ? 'bg-purple-950/20 border-purple-500/30 text-slate-400 line-through'
                      : 'bg-slate-950/60 border-slate-850 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.packed ? (
                      <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">{item.item}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>

            {/* Add Custom Item */}
            <form onSubmit={handleAddPackingItem} className="flex gap-2 pt-1 no-print">
              <input
                type="text"
                value={newPackingItem}
                onChange={e => setNewPackingItem(e.target.value)}
                placeholder="Add custom item..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                title="Add Item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
