import React from 'react';
import { TravelGlobe } from './TravelGlobe.tsx';
import { Destination } from '../../types/travel.ts';
import { sound } from '../../utils/audio.ts';
import { X, Globe } from 'lucide-react';

interface GlobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  flightRoute?: {
    origin: { name: string; lat: number; lng: number };
    destination: { name: string; lat: number; lng: number };
  } | null;
}

export const GlobeModal: React.FC<GlobeModalProps> = ({
  isOpen,
  onClose,
  selectedDestination,
  onSelectDestination,
  flightRoute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Interactive 3D Earth Simulation</h3>
              <p className="text-[11px] text-slate-400">Drag to rotate, scroll to zoom, click pins to focus</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Globe Viewport */}
        <div className="flex-1 relative w-full h-full">
          <TravelGlobe
            selectedDestination={selectedDestination}
            onSelectDestination={onSelectDestination}
            flightRoute={flightRoute}
          />
        </div>
      </div>
    </div>
  );
};
