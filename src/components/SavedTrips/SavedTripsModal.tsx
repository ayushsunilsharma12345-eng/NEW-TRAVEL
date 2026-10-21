import React from 'react';
import { TripPlan } from '../../types/travel';
import { sound } from '../../utils/audio';
import { Bookmark, Calendar, MapPin, Trash2, ArrowRight, X, Sparkles } from 'lucide-react';

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrips: TripPlan[];
  onSelectTrip: (trip: TripPlan) => void;
  onDeleteTrip: (id: string) => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  savedTrips,
  onSelectTrip,
  onDeleteTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Your Saved Trips Library</h3>
              <p className="text-xs text-slate-400">
                {savedTrips.length} {savedTrips.length === 1 ? 'itinerary' : 'itineraries'} stored locally on this device.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedTrips.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No Saved Trips Yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Generate an itinerary in the Trip Planner and click "Save Itinerary" to keep it accessible anytime.
              </p>
            </div>
          ) : (
            savedTrips.map(trip => (
              <div
                key={trip.id}
                className="group relative bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {trip.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                      {trip.durationDays}d · {trip.travelStyle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {trip.destination.name}, {trip.destination.country}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-emerald-400">
                      {trip.costBreakdown.currency} {trip.costBreakdown.totalEstimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectTrip(trip);
                      onClose();
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                  >
                    <span>View Itinerary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onDeleteTrip(trip.id);
                    }}
                    className="p-2 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-xl transition-colors"
                    title="Delete saved trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
