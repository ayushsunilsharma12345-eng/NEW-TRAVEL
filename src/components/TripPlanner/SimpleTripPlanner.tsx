import React, { useState } from 'react';
import { TripPreferences, Destination } from '../../types/travel.ts';
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS } from '../../data/popularDestinations.ts';
import { sound } from '../../utils/audio.ts';
import confetti from 'canvas-confetti';
import { Sparkles, Dices, Plane, Heart, MapPin, Users, Calendar, Check } from 'lucide-react';

interface SimpleTripPlannerProps {
  onGenerate: (prefs: TripPreferences) => void;
  isLoading: boolean;
  selectedDestination?: Destination | null;
  onSelectDestination?: (dest: Destination) => void;
}

const KID_FRIENDLY_DESTINATIONS = [
  { id: 'paris', name: 'Paris', country: 'France', emoji: '🗼', desc: 'See the sparkling Eiffel Tower & eat warm croissants!' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', emoji: '🏯', desc: 'Giant robots, sushi trains & neon arcades!' },
  { id: 'bali', name: 'Bali', country: 'Indonesia', emoji: '🏝️', desc: 'Playful monkey temples & warm tropical beaches!' },
  { id: 'newyork', name: 'New York', country: 'United States', emoji: '🗽', desc: 'Statue of Liberty, Broadway & giant Central Park!' },
  { id: 'rome', name: 'Rome', country: 'Italy', emoji: '🏛️', desc: 'Colosseum gladiators & authentic gelato ice cream!' },
  { id: 'reykjavik', name: 'Iceland', country: 'Iceland', emoji: '🌋', desc: 'Northern Lights, geysers & warm blue lagoons!' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', emoji: '🐪', desc: 'Ancient giant pyramids & sunset camel rides!' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', emoji: '🦘', desc: 'Sydney Opera House, surfing & cute koalas!' }
];

export const SimpleTripPlanner: React.FC<SimpleTripPlannerProps> = ({
  onGenerate,
  isLoading,
  selectedDestination,
  onSelectDestination,
}) => {
  const [chosenCity, setChosenCity] = useState<string>(selectedDestination?.name || 'Tokyo');
  const [chosenDays, setChosenDays] = useState<number>(5);
  const [chosenParty, setChosenParty] = useState<number>(2);
  const [chosenFunStyle, setChosenFunStyle] = useState<string>('balanced');
  const [startingCity, setStartingCity] = useState<string>('London (LHR)');

  // Handle Surprise Me randomizer
  const handleSurpriseMe = () => {
    sound.playPinSelect();
    const randomDest = POPULAR_DESTINATIONS[Math.floor(Math.random() * POPULAR_DESTINATIONS.length)];
    setChosenCity(randomDest.name);
    if (onSelectDestination) {
      onSelectDestination(randomDest);
    }
    // Confetti burst
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // safe fallback
    }
  };

  const handleStartAdventure = () => {
    sound.playClick();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }

    onGenerate({
      origin: startingCity,
      destination: chosenCity,
      durationDays: chosenDays,
      travelers: chosenParty,
      travelStyle: chosenFunStyle as 'balanced' | 'backpacker' | 'luxury' | 'adventure' | 'cultural' | 'family',
      budgetLevel: 'moderate',
      currency: 'USD ($)',
      interests: ['Sightseeing', 'Delicious Local Food', 'Fun Activities'],
    });
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-8 max-w-4xl mx-auto">
      {/* Friendly Big Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          Super Easy 1-Minute Trip Creator 🎈
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Where in the World Do You Want to Go?
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Just tap your favorite city, pick how many days you want to explore, and watch our AI build your dream trip!
        </p>
      </div>

      {/* STEP 1: Pick a Dream City */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
            Pick Your Dream Destination:
          </label>
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span>Surprise Me! 🎲</span>
          </button>
        </div>

        {/* City Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KID_FRIENDLY_DESTINATIONS.map(city => {
            const isSelected = chosenCity.toLowerCase().includes(city.name.toLowerCase());
            return (
              <button
                type="button"
                key={city.id}
                onClick={() => {
                  sound.playPinSelect();
                  setChosenCity(city.name);
                  const fullDest = POPULAR_DESTINATIONS.find(d => d.id === city.id);
                  if (fullDest && onSelectDestination) {
                    onSelectDestination(fullDest);
                  }
                }}
                className={`relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-98 ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="text-2xl sm:text-3xl mb-1.5">{city.emoji}</div>
                <div className="font-extrabold text-sm sm:text-base text-white">{city.name}</div>
                <div className="text-[11px] text-cyan-400 font-medium">{city.country}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{city.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: How Many Days? */}
      <div className="space-y-3">
        <label className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center">2</span>
          How Many Days of Adventure?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { days: 3, label: '3 Days', desc: '⚡ Quick Weekend' },
            { days: 5, label: '5 Days', desc: '🎈 Perfect Week' },
            { days: 7, label: '7 Days', desc: '🚀 Full Explorer' },
            { days: 10, label: '10 Days', desc: '🗺️ Epic Journey' }
          ].map(d => (
            <button
              type="button"
              key={d.days}
              onClick={() => {
                sound.playClick();
                setChosenDays(d.days);
              }}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                chosenDays === d.days
                  ? 'bg-blue-600/30 border-blue-400 text-white ring-2 ring-blue-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="font-extrabold text-base sm:text-lg text-white">{d.label}</div>
              <div className="text-xs text-blue-300 font-medium">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 3: Who is Traveling? */}
      <div className="space-y-3">
        <label className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-black text-xs flex items-center justify-center">3</span>
          Who is Packing Their Bags?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { count: 1, icon: '🎒', title: 'Just Me', sub: 'Solo Traveler' },
            { count: 2, icon: '👫', title: 'Two of Us', sub: 'Couple or 2 Besties' },
            { count: 4, icon: '👨‍👩‍👧‍👦', title: 'Family or Crew', sub: '4 Travelers together' }
          ].map(p => (
            <button
              type="button"
              key={p.count}
              onClick={() => {
                sound.playClick();
                setChosenParty(p.count);
              }}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                chosenParty === p.count
                  ? 'bg-purple-600/30 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">{p.icon}</span>
              <div className="text-left">
                <div className="font-extrabold text-sm sm:text-base text-white">{p.title}</div>
                <div className="text-[11px] text-purple-300">{p.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 4: Departure Airport Chip Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-cyan-400" />
            Flying out from:
          </span>
          <span className="text-cyan-300 font-bold">{startingCity}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ORIGINS.slice(0, 5).map(orig => (
            <button
              type="button"
              key={orig.name}
              onClick={() => {
                sound.playClick();
                setStartingCity(orig.name);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                startingCity === orig.name
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {orig.name.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* BIG MAGIC SUBMIT BUTTON */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleStartAdventure}
          disabled={isLoading}
          className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white font-extrabold text-lg sm:text-xl tracking-wide shadow-2xl shadow-cyan-500/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Building Your Adventure with AI Magic... ✨</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-amber-300 animate-bounce" />
              <span>Plan My Magic {chosenCity} Trip Now! 🚀</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
