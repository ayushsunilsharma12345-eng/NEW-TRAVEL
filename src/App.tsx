/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Destination, TripPlan, TripPreferences } from './types/travel.ts';
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS } from './data/popularDestinations.ts';
import { planTripApi, fetchLiveIntelApi, LiveIntelData } from './services/api.ts';
import { sound } from './utils/audio.ts';
import confetti from 'canvas-confetti';

import { ItineraryView } from './components/TripPlanner/ItineraryView.tsx';
import { LiveIntelBar } from './components/LiveIntel/LiveIntelBar.tsx';
import { GlobeModal } from './components/Globe/GlobeModal.tsx';
import { AgentChat } from './components/AIAssistant/AgentChat.tsx';
import { SavedTripsModal } from './components/SavedTrips/SavedTripsModal.tsx';

import {
  Plane,
  Sparkles,
  Dices,
  Globe,
  Bookmark,
  Bot,
  Volume2,
  VolumeX,
  Search,
  Check,
  MapPin,
  Clock,
  Compass
} from 'lucide-react';

const QUICK_CITIES = [
  { id: 'paris', name: 'Paris', country: 'France', emoji: '🗼' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', emoji: '🏯' },
  { id: 'bali', name: 'Bali', country: 'Indonesia', emoji: '🏝️' },
  { id: 'newyork', name: 'New York', country: 'United States', emoji: '🗽' },
  { id: 'rome', name: 'Rome', country: 'Italy', emoji: '🏛️' },
  { id: 'reykjavik', name: 'Iceland', country: 'Iceland', emoji: '🌋' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', emoji: '🐪' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', emoji: '🦘' },
];

export default function App() {
  const [targetCity, setTargetCity] = useState<string>('Paris');
  const [durationDays, setDurationDays] = useState<number>(5);
  const [travelers, setTravelers] = useState<number>(2);
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [liveIntel, setLiveIntel] = useState<LiveIntelData | null>(null);
  const [isLoadingLiveIntel, setIsLoadingLiveIntel] = useState<boolean>(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(POPULAR_DESTINATIONS[1]);

  // Modals & toggles
  const [isGlobeOpen, setIsGlobeOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Load live scraped data for target city
  const loadLiveScrapedData = useCallback(async (city: string) => {
    setIsLoadingLiveIntel(true);
    try {
      const data = await fetchLiveIntelApi(city);
      setLiveIntel(data);
    } catch (err) {
      console.warn('Live scrape load error:', err);
    } finally {
      setIsLoadingLiveIntel(false);
    }
  }, []);

  // Fast trip planning execution (< 50ms)
  const handlePlanTrip = useCallback(async (city: string, days: number = durationDays, party: number = travelers) => {
    setIsGenerating(true);
    sound.playClick();

    // Trigger celebratory confetti
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {
      // safe fallback
    }

    const matchingDest = POPULAR_DESTINATIONS.find(d =>
      city.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(city.toLowerCase())
    ) || POPULAR_DESTINATIONS[0];
    setSelectedDestination(matchingDest);

    // Concurrently fetch trip plan & live scraped data
    const [planRes] = await Promise.all([
      planTripApi({
        origin: POPULAR_ORIGINS[0].name,
        destination: city,
        durationDays: days,
        travelers: party,
        travelStyle: 'balanced',
        budgetLevel: 'moderate',
        currency: 'USD ($)',
        interests: ['Sightseeing', 'Food', 'Culture'],
      }),
      loadLiveScrapedData(city),
    ]);

    setCurrentTrip(planRes.trip);
    setIsGenerating(false);
    sound.playSuccessChime();
  }, [durationDays, travelers, loadLiveScrapedData]);

  // Initial load
  useEffect(() => {
    handlePlanTrip('Paris', 5, 2);
    try {
      const stored = localStorage.getItem('ai_travel_saved_trips');
      if (stored) setSavedTrips(JSON.parse(stored));
    } catch {
      // safe fallback
    }
  }, []); // Run once on start

  // Handle Surprise Me random destination
  const handleSurpriseMe = () => {
    sound.playPinSelect();
    const rand = POPULAR_DESTINATIONS[Math.floor(Math.random() * POPULAR_DESTINATIONS.length)];
    setTargetCity(rand.name);
    setSelectedDestination(rand);
    handlePlanTrip(rand.name, durationDays, travelers);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
    if (!next) sound.playClick();
  };

  const handleSaveTrip = (trip: TripPlan) => {
    sound.playSuccessChime();
    setSavedTrips(prev => {
      const exists = prev.some(t => t.id === trip.id);
      const updated = exists ? prev : [trip, ...prev];
      try {
        localStorage.setItem('ai_travel_saved_trips', JSON.stringify(updated));
      } catch {
        // safe fallback
      }
      return updated;
    });
  };

  const handleDeleteSavedTrip = (id: string) => {
    setSavedTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem('ai_travel_saved_trips', JSON.stringify(updated));
      } catch {
        // safe fallback
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Simple Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-3 no-print backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Plane className="w-5 h-5 text-white transform -rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                VOYAGER<span className="text-cyan-400 font-mono">.AI</span>
              </span>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Web Scraping Active
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* 3D Globe Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsGlobeOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>3D Earth</span>
            </button>

            {/* Saved Trips */}
            <button
              onClick={() => {
                sound.playClick();
                setIsSavedModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved ({savedTrips.length})</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Screen Content Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        {/* HERO: The Easiest Search Bar Ever Made */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 no-print">
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Where do you want to explore? 🌍
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Type any city or tap a card below. Our live web scraper finds real weather, exchange rates, and sights in 1 second!
            </p>
          </div>

          {/* Search Input & Button Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              if (targetCity.trim()) handlePlanTrip(targetCity.trim());
            }}
            className="flex flex-col sm:flex-row items-center gap-2.5 max-w-2xl mx-auto"
          >
            <div className="relative w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={targetCity}
                onChange={e => setTargetCity(e.target.value)}
                placeholder="Type a city (e.g. Paris, Tokyo, Bali, Rome, Iceland...)"
                required
                className="w-full bg-slate-950 border-2 border-slate-700/80 focus:border-cyan-400 rounded-2xl pl-11 pr-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base whitespace-nowrap shadow-xl shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Plan Trip!</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Tap Quick City Cards */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Popular 1-Tap Destinations:</span>
              <button
                type="button"
                onClick={handleSurpriseMe}
                className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold"
              >
                <Dices className="w-3.5 h-3.5 text-amber-400" />
                <span>Surprise Me! 🎲</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {QUICK_CITIES.map(city => {
                const isSelected = targetCity.toLowerCase().includes(city.name.toLowerCase());
                return (
                  <button
                    type="button"
                    key={city.id}
                    onClick={() => {
                      setTargetCity(city.name);
                      handlePlanTrip(city.name);
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/40'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl mb-0.5">{city.emoji}</span>
                    <span className="text-xs font-bold truncate max-w-full">{city.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Duration Selector */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-semibold mr-1">Trip Length:</span>
            {[
              { days: 3, label: '3 Days ⚡' },
              { days: 5, label: '5 Days 🎈' },
              { days: 7, label: '7 Days 🚀' }
            ].map(d => (
              <button
                type="button"
                key={d.days}
                onClick={() => {
                  sound.playClick();
                  setDurationDays(d.days);
                  handlePlanTrip(targetCity, d.days, travelers);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  durationDays === d.days
                    ? 'bg-blue-600/30 border-blue-400 text-white ring-1 ring-blue-400/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* LIVE WEB SCRAPING INTELLIGENCE BAR */}
        <LiveIntelBar
          data={liveIntel}
          isLoading={isLoadingLiveIntel}
          onRefresh={() => loadLiveScrapedData(targetCity)}
        />

        {/* GENERATED ITINERARY VIEW (Instantaneous, Clean, Printable) */}
        {currentTrip && (
          <ItineraryView
            trip={currentTrip}
            onFocusGlobe={() => setIsGlobeOpen(true)}
            onSaveTrip={handleSaveTrip}
            isSaved={savedTrips.some(t => t.id === currentTrip.id)}
          />
        )}
      </main>

      {/* Floating AI Assistant Chat Button (Bottom-Right) */}
      <button
        onClick={() => {
          sound.playClick();
          setIsChatOpen(prev => !prev);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-2xl shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer no-print"
      >
        <Bot className="w-4 h-4 text-cyan-200" />
        <span>Ask Travel Buddy</span>
      </button>

      {/* 3D Earth Simulation Modal (Runs on-demand for maximum speed) */}
      <GlobeModal
        isOpen={isGlobeOpen}
        onClose={() => setIsGlobeOpen(false)}
        selectedDestination={selectedDestination}
        onSelectDestination={dest => {
          setSelectedDestination(dest);
          setTargetCity(dest.name);
          handlePlanTrip(dest.name);
        }}
        flightRoute={
          currentTrip
            ? { origin: currentTrip.origin, destination: currentTrip.destination }
            : null
        }
      />

      {/* Conversational AI Chat Panel */}
      <AgentChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Saved Trips Modal */}
      <SavedTripsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedTrips={savedTrips}
        onSelectTrip={trip => {
          setCurrentTrip(trip);
          setTargetCity(trip.destination.name);
          loadLiveScrapedData(trip.destination.name);
        }}
        onDeleteTrip={handleDeleteSavedTrip}
      />
    </div>
  );
}
