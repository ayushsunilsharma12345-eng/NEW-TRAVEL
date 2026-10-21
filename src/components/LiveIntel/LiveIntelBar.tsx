import React from 'react';
import { LiveIntelData } from '../../services/api.ts';
import { CloudSun, DollarSign, Globe, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface LiveIntelBarProps {
  data: LiveIntelData | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const LiveIntelBar: React.FC<LiveIntelBarProps> = ({ data, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-3 text-xs text-cyan-300">
        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Scraping live weather, exchange rates & web intel...</span>
      </div>
    );
  }

  if (!data) return null;

  const targetRate = data.currencyRates.EUR; // Default comparison or based on country

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      {/* Top Banner: Real Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
            Live Web Scraper Active
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">Real-time data for {data.city}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Update Now</span>
          </button>
        )}
      </div>

      {/* 3 Live Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Live Weather */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="text-3xl">{data.weather.emoji}</div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Live Weather Right Now</div>
            <div className="text-base font-extrabold text-white">
              {data.weather.temperatureC}°C <span className="text-xs text-slate-400 font-normal">({data.weather.temperatureF}°F)</span>
            </div>
            <div className="text-[11px] text-cyan-300 truncate">
              {data.weather.condition} · Wind {data.weather.windSpeedKmH} km/h
            </div>
          </div>
        </div>

        {/* 2. Live Currency */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Live FX Exchange Rate</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              $100 USD = {(100 * targetRate).toFixed(1)} EUR
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              1 USD = {data.currencyRates.JPY} JPY · {data.currencyRates.GBP} GBP
            </div>
          </div>
        </div>

        {/* 3. Live Web Scraped Highlights */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          {data.wiki.thumbnail ? (
            <img
              src={data.wiki.thumbnail}
              alt={data.city}
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>Live Web Excerpt</span>
              {data.wiki.pageUrl && (
                <a
                  href={data.wiki.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300"
                  title="Source on Wikipedia"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="text-xs text-slate-200 line-clamp-2 leading-tight mt-0.5">
              {data.wiki.extract}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
