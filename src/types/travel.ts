export interface Destination {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  tagline: string;
  description: string;
  bestTimeToVisit: string;
  currency: string;
  language: string;
  badge: string;
  highlights: string[];
  avgDailyCost: number; // in USD
}

export type TravelStyle = 'backpacker' | 'balanced' | 'luxury' | 'adventure' | 'cultural' | 'family';
export type BudgetLevel = 'budget' | 'moderate' | 'luxury';

export interface TripPreferences {
  origin: string;
  destination: string;
  durationDays: number;
  travelers: number;
  travelStyle: TravelStyle;
  budgetLevel: BudgetLevel;
  currency: string;
  interests: string[];
  customNotes?: string;
}

export interface ItineraryActivity {
  id: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  timeRange: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  category: 'sightseeing' | 'dining' | 'culture' | 'adventure' | 'relaxation' | 'transit';
  tips: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  activities: ItineraryActivity[];
  daySummary?: string;
}

export interface CostBreakdown {
  flights: number;
  accommodation: number;
  activities: number;
  foodDining: number;
  localTransit: number;
  emergencyBuffer: number;
  totalEstimatedCost: number;
  currency: string;
}

export interface WeatherAdvisory {
  temperatureRange: string;
  season: string;
  conditionSummary: string;
  rainLikelihood: string;
  whatToWear: string;
}

export interface SmartAdvisory {
  safetyIndex: string;
  visaInfo: string;
  tapWater: string;
  tippingCulture: string;
  emergencyNumbers: string;
  connectivityAdvice: string;
  localEtiquette: string[];
}

export interface PackingItem {
  id: string;
  item: string;
  category: 'Clothing' | 'Electronics' | 'Documents' | 'Toiletries' | 'Essentials' | 'Health';
  packed: boolean;
}

export interface FlightIntelligence {
  distanceKm: number;
  directFlightHours: number;
  carbonEstimateKg: number;
  bestBookingLeadTime: string;
}

export interface TripPlan {
  id: string;
  createdAt: string;
  title: string;
  origin: {
    name: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    country: string;
    lat: number;
    lng: number;
  };
  durationDays: number;
  travelers: number;
  travelStyle: TravelStyle;
  budgetLevel: BudgetLevel;
  currency: string;
  overview: string;
  days: ItineraryDay[];
  costBreakdown: CostBreakdown;
  weatherAdvisory: WeatherAdvisory;
  smartAdvisory: SmartAdvisory;
  packingList: PackingItem[];
  flightIntelligence: FlightIntelligence;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}
