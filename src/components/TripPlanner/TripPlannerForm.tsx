import React, { useState } from 'react';
import { TripPreferences, TravelStyle, BudgetLevel, Destination } from '../../types/travel';
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS } from '../../data/popularDestinations';
import { sound } from '../../utils/audio';
import { Sparkles, Calendar, Users, DollarSign, Compass, MapPin, PlaneTakeoff, Heart } from 'lucide-react';

interface TripPlannerFormProps {
  onGenerate: (prefs: TripPreferences) => void;
  isLoading: boolean;
  initialDestination?: Destination | null;
}

const INTERESTS_OPTIONS = [
  'Culinary & Local Food',
  'Art & Architecture',
  'Hidden Local Gems',
  'Historical Monuments',
  'Nature & Scenic Landscapes',
  'Beaches & Coastal Walks',
  'Photography Hotspots',
  'Nightlife & Rooftop Lounges',
  'Wellness & Thermal Spas',
  'Shopping & Artisan Bazaars'
];

const CURRENCIES = ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'JPY (¥)', 'AUD ($)', 'CAD ($)'];

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({
  onGenerate,
  isLoading,
  initialDestination,
}) => {
  const [origin, setOrigin] = useState<string>(POPULAR_ORIGINS[0].name);
  const [destination, setDestination] = useState<string>(initialDestination?.name || 'Tokyo, Japan');
  const [durationDays, setDurationDays] = useState<number>(5);
  const [travelers, setTravelers] = useState<number>(2);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('moderate');
  const [currency, setCurrency] = useState<string>('USD ($)');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Culinary & Local Food',
    'Historical Monuments',
    'Hidden Local Gems'
  ]);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Update destination if initialDestination changes from globe click
  React.useEffect(() => {
    if (initialDestination) {
      setDestination(`${initialDestination.name}, ${initialDestination.country}`);
    }
  }, [initialDestination]);

  const toggleInterest = (interest: string) => {
    sound.playClick();
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    sound.playClick();
    onGenerate({
      origin,
      destination,
      durationDays,
      travelers,
      travelStyle,
      budgetLevel,
      currency,
      interests: selectedInterests,
      customNotes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Travel Intelligence Engine
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Configure Your Journey</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Personalized day-by-day scheduling, accurate budgets, and live advisories powered by Google Gemini.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Currency:</span>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {CURRENCIES.map(curr => (
              <option key={curr} value={curr} className="bg-slate-900 text-white">
                {curr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400" />
            Departure City / Airport
          </label>
          <div className="relative">
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="e.g. New York (JFK), London (LHR), Mumbai"
              required
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
          {/* Quick origin presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500">Quick:</span>
            {POPULAR_ORIGINS.slice(0, 4).map(o => (
              <button
                type="button"
                key={o.name}
                onClick={() => {
                  sound.playClick();
                  setOrigin(o.name);
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {o.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Target Destination
          </label>
          <div className="relative">
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Paris, Bali, Reykjavik"
              required
              className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
          {/* Quick destination presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500">Popular:</span>
            {POPULAR_DESTINATIONS.slice(0, 5).map(d => (
              <button
                type="button"
                key={d.id}
                onClick={() => {
                  sound.playClick();
                  setDestination(`${d.name}, ${d.country}`);
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Duration & Travelers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Trip Duration
            </span>
            <span className="text-cyan-400 font-bold font-mono">{durationDays} Days</span>
          </div>
          <div className="flex gap-2">
            {[3, 5, 7, 10, 14].map(days => (
              <button
                type="button"
                key={days}
                onClick={() => {
                  sound.playClick();
                  setDurationDays(days);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  durationDays === days
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Travelers Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Travelers Party
            </span>
            <span className="text-purple-400 font-bold font-mono">
              {travelers} {travelers === 1 ? 'Solo' : travelers === 2 ? 'Couple' : 'Travelers'}
            </span>
          </div>
          <div className="flex gap-2">
            {[
              { count: 1, label: 'Solo' },
              { count: 2, label: 'Couple' },
              { count: 3, label: '3-4' },
              { count: 6, label: 'Group 5+' },
            ].map(item => (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  sound.playClick();
                  setTravelers(item.count);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  travelers === item.count
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Travel Style Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          Travel Experience Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'balanced', label: 'Balanced', desc: 'Curated mix' },
            { id: 'backpacker', label: 'Backpacker', desc: 'Budget & social' },
            { id: 'luxury', label: 'Luxury', desc: '5-star indulgence' },
            { id: 'adventure', label: 'Adventure', desc: 'Hikes & thrill' },
            { id: 'cultural', label: 'Cultural', desc: 'Heritage & food' },
            { id: 'family', label: 'Family', desc: 'Kid friendly' },
          ].map(style => (
            <button
              type="button"
              key={style.id}
              onClick={() => {
                sound.playClick();
                setTravelStyle(style.id as TravelStyle);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                travelStyle === style.id
                  ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold capitalize text-slate-200">{style.label}</div>
              <div className="text-[10px] text-slate-500">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Tier Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          Budget Tier Preference
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'budget', title: 'Economy / Budget', desc: 'Hostels, local transit & street food' },
            { id: 'moderate', title: 'Moderate / Balanced', desc: '3-4★ hotels, mixed dining & experiences' },
            { id: 'luxury', title: 'Premium / Luxury', desc: '5★ stays, private transfers & fine dining' },
          ].map(tier => (
            <button
              type="button"
              key={tier.id}
              onClick={() => {
                sound.playClick();
                setBudgetLevel(tier.id as BudgetLevel);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                budgetLevel === tier.id
                  ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{tier.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{tier.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interests Checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          Focus Interests (Select all that appeal)
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS_OPTIONS.map(interest => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <button
                type="button"
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Special Requests / Dietary / Accessibility Notes (Optional)
        </label>
        <input
          type="text"
          value={customNotes}
          onChange={e => setCustomNotes(e.target.value)}
          placeholder="e.g. Vegetarian dining, avoid strenuous uphill walks, include sunset vantage points"
          className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 p-4 text-white font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-3">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Intelligence Itinerary with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>Generate Intelligence Itinerary & Visual Flight Arc</span>
              </>
            )}
          </div>
        </button>
      </div>
    </form>
  );
};
