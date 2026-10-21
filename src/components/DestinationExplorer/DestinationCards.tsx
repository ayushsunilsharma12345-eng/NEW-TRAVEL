import React, { useState } from 'react';
import { Destination } from '../../types/travel';
import { POPULAR_DESTINATIONS } from '../../data/popularDestinations';
import { sound } from '../../utils/audio';
import { Globe, Plane, Sparkles, DollarSign, Calendar, Search } from 'lucide-react';

interface DestinationCardsProps {
  onSelectDestination: (dest: Destination) => void;
  onQuickPlan: (dest: Destination) => void;
}

export const DestinationCards: React.FC<DestinationCardsProps> = ({
  onSelectDestination,
  onQuickPlan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContinent, setFilterContinent] = useState('all');

  const filtered = POPULAR_DESTINATIONS.filter(dest => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Curated Global Destination Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Handpicked global travel hubs with authentic local highlights, optimal visit seasons, and 3D globe coordinates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter destinations..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Destination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(dest => (
          <div
            key={dest.id}
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {dest.badge}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  ~${dest.avgDailyCost}/day
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                {dest.name}
              </h3>
              <div className="text-xs text-slate-400 font-medium">{dest.country}</div>

              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {dest.description}
              </p>

              {/* Best Season */}
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{dest.bestTimeToVisit}</span>
              </div>

              {/* Highlights List */}
              <div className="mt-3 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Signature Highlights
                </div>
                <div className="flex flex-wrap gap-1">
                  {dest.highlights.slice(0, 3).map((hl, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {hl}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectDestination(dest);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                3D Globe
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onQuickPlan(dest);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <Plane className="w-3.5 h-3.5" />
                Plan Trip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
