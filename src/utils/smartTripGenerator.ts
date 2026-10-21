import { TripPlan, TripPreferences } from '../types/travel.ts';
import { POPULAR_DESTINATIONS, POPULAR_ORIGINS } from '../data/popularDestinations.ts';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getCoordinatesForPlace(placeName?: string) {
  const lower = (placeName || 'London').toLowerCase();
  for (const dest of POPULAR_DESTINATIONS) {
    if (lower.includes(dest.name.toLowerCase()) || lower.includes(dest.country.toLowerCase())) {
      return { lat: dest.lat, lng: dest.lng, name: dest.name, country: dest.country, tagline: dest.tagline };
    }
  }
  for (const orig of POPULAR_ORIGINS) {
    if (lower.includes(orig.name.toLowerCase().split(',')[0])) {
      return { lat: orig.lat, lng: orig.lng, name: orig.name, country: '', tagline: 'Starting point' };
    }
  }
  return { lat: 20.0, lng: 0.0, name: placeName || 'London', country: '', tagline: 'Adventure location' };
}

// Simple activity sets for kids and travelers of any age
const FUN_ACTIVITIES_BY_CITY: Record<string, Array<{ title: string; desc: string; emoji: string; tip: string }>> = {
  tokyo: [
    { title: 'Visit Shibuya Crossing & the Loyal Dog Hachiko Statue', desc: 'Walk across the busiest and coolest zebra crossing in the world, then say hi to the famous bronze dog statue!', emoji: '🐕', tip: 'Take a fun selfie from the second-floor cafe window!' },
    { title: 'Explore Akihabara Giant Toy & Arcade Towers', desc: 'Play claw machines, see life-sized superhero statues, and taste yummy Japanese snacks and melon soda!', emoji: '👾', tip: 'Try the fun photo booths called Purikura!' },
    { title: 'Eat Warm Ramen & Conveyor Belt Sushi', desc: 'Watch delicious sushi plates zoom right to your table on mini bullet train tracks!', emoji: '🍣', tip: 'Press the hot water button carefully at your seat.' },
    { title: 'Walk through Giant Torii Gates at Meiji Shrine & Yoyogi Park', desc: 'Stroll under towering green trees in a peaceful forest hidden right inside the city.', emoji: '⛩️', tip: 'Make a wish and write it on a wooden plaque!' }
  ],
  paris: [
    { title: 'Climb Up the Sparkling Eiffel Tower', desc: 'Ride the glass elevator high up to see all the tiny rooftops and boats of Paris spread out below you!', emoji: '🗼', tip: 'Watch the tower twinkle with thousands of golden lights at night!' },
    { title: 'Fresh Warm Croissant & Hot Chocolate at a Sidewalk Cafe', desc: 'Bite into the crispiest, butteriest pastry you have ever tasted while listening to French accordion music.', emoji: '🥐', tip: 'Dip your croissant in the chocolate like French kids do!' },
    { title: 'Boat Cruise on the Seine River', desc: 'Float past ancient stone bridges, gargoyles of Notre Dame, and wave at people along the banks.', emoji: '🚢', tip: 'Sit on the open top deck for the best breeze and photos.' },
    { title: 'Discover the Mona Lisa & Giant Dinosaur Fossils', desc: 'Visit the famous Louvre glass pyramid and hunt for the world\'s most famous painting.', emoji: '🎨', tip: 'Look at the Mona Lisa\'s eyes—they seem to follow you everywhere!' }
  ],
  bali: [
    { title: 'Visit the Sacred Monkey Forest in Ubud', desc: 'Walk through ancient mossy stone temples where playful monkeys swing from huge jungle vine trees!', emoji: '🐒', tip: 'Keep your sunglasses and snacks zipped in your backpack.' },
    { title: 'Walk on Giant Emerald Green Rice Terraces', desc: 'Stroll along stepped green hills like giant natural staircases built by Balinese farmers centuries ago.', emoji: '🌾', tip: 'Try the famous jungle giant swing if you like flying high!' },
    { title: 'Watch the Fiery Kecak Sunset Dance at Uluwatu Cliff', desc: 'Sit on top of a 200-foot ocean cliff and watch traditional dancers chant with fire torches as the sun dips into the sea.', emoji: '🔥', tip: 'Arrive 30 minutes before sunset for the best front seats.' },
    { title: 'Splash in Tropical Coral Reefs with Sea Turtles', desc: 'Put on a mask and snorkel to watch colorful striped clownfish and gentle sea turtles swim in warm clear waters.', emoji: '🐢', tip: 'Never touch the corals; stay floating gently on top!' }
  ]
};

export function generateSmartTripPlan(prefs: TripPreferences): TripPlan {
  const destCoords = getCoordinatesForPlace(prefs.destination);
  const origCoords = getCoordinatesForPlace(prefs.origin);
  const dist = calculateDistanceKm(origCoords.lat, origCoords.lng, destCoords.lat, destCoords.lng) || 3800;
  const flightHours = Math.max(1.5, Math.round((dist / 800) * 10) / 10);
  const daysCount = prefs.durationDays || 4;

  const currencySymbol = prefs.currency || 'USD ($)';
  const multiplier = prefs.budgetLevel === 'luxury' ? 2.5 : prefs.budgetLevel === 'budget' ? 0.7 : 1.2;
  const baseFlight = Math.round((dist * 0.11 * multiplier) / 10) * 10;
  const dailyStay = Math.round(95 * multiplier);
  const dailyFood = Math.round(45 * multiplier);
  const dailyAct = Math.round(35 * multiplier);
  const dailyTransit = Math.round(15 * multiplier);

  const totalStay = dailyStay * daysCount;
  const totalFood = dailyFood * daysCount * prefs.travelers;
  const totalAct = dailyAct * daysCount * prefs.travelers;
  const totalTransit = dailyTransit * daysCount * prefs.travelers;
  const totalFlight = baseFlight * prefs.travelers;
  const buffer = Math.round((totalStay + totalFood + totalAct + totalTransit + totalFlight) * 0.08);

  const cityKey = destCoords.name.toLowerCase();
  const cityActivities = FUN_ACTIVITIES_BY_CITY[cityKey] || [
    { title: `Explore the Famous Landmarks of ${destCoords.name}`, desc: `Kick off with an exciting walking tour to see the most iconic sights, fountains, and historic buildings!`, emoji: '🌟', tip: 'Wear comfy sneakers and bring a water bottle!' },
    { title: `Taste Yummy Local Food & Snacks`, desc: `Visit local bakeries, markets, and ice-cream parlors to taste traditional sweet and savory treats!`, emoji: '🍦', tip: 'Ask the friendly shopkeeper what their favorite treat is.' },
    { title: `Scenic Parks, Cable Cars or Boat Rides`, desc: `Enjoy high-up panoramic views or relaxed boat trips around the city\'s greenest parks and rivers.`, emoji: '🚠', tip: 'Keep your camera ready for the best panorama shot!' },
    { title: `Sunset Celebration & Night City Lights`, desc: `Watch the sunset paint the sky in pink and orange, then watch the whole city glow with glittering lights.`, emoji: '✨', tip: 'A light sweater is nice when the evening breeze kicks in.' }
  ];

  const days = [];
  for (let i = 1; i <= daysCount; i++) {
    const actIdx = (i - 1) % cityActivities.length;
    const morningAct = cityActivities[actIdx];
    const afternoonAct = cityActivities[(actIdx + 1) % cityActivities.length];
    const eveningAct = cityActivities[(actIdx + 2) % cityActivities.length];
    const nightAct = cityActivities[(actIdx + 3) % cityActivities.length];

    days.push({
      dayNumber: i,
      theme: `Day ${i}: Big Adventure in ${destCoords.name}!`,
      daySummary: `A joyful day packed with easy-to-follow fun, delicious food stops, and memorable sights.`,
      activities: [
        {
          id: `act-${i}-1`,
          timeSlot: 'Morning' as const,
          timeRange: '09:00 - 12:00',
          title: `${morningAct.emoji} ${morningAct.title}`,
          description: morningAct.desc,
          location: `${destCoords.name} Historic Center`,
          estimatedCost: Math.round(18 * multiplier),
          category: 'sightseeing' as const,
          tips: morningAct.tip
        },
        {
          id: `act-${i}-2`,
          timeSlot: 'Afternoon' as const,
          timeRange: '13:00 - 16:30',
          title: `${afternoonAct.emoji} ${afternoonAct.title}`,
          description: afternoonAct.desc,
          location: `${destCoords.name} Cultural District`,
          estimatedCost: Math.round(28 * multiplier),
          category: 'culture' as const,
          tips: afternoonAct.tip
        },
        {
          id: `act-${i}-3`,
          timeSlot: 'Evening' as const,
          timeRange: '17:30 - 20:00',
          title: `${eveningAct.emoji} ${eveningAct.title}`,
          description: eveningAct.desc,
          location: `${destCoords.name} Sunset Viewpoint`,
          estimatedCost: Math.round(35 * multiplier),
          category: 'dining' as const,
          tips: eveningAct.tip
        },
        {
          id: `act-${i}-4`,
          timeSlot: 'Night' as const,
          timeRange: '20:30 - 22:00',
          title: `${nightAct.emoji} ${nightAct.title}`,
          description: nightAct.desc,
          location: `${destCoords.name} Promenade`,
          estimatedCost: Math.round(12 * multiplier),
          category: 'relaxation' as const,
          tips: nightAct.tip
        }
      ]
    });
  }

  return {
    id: `trip-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: `Amazing ${daysCount}-Day Adventure to ${destCoords.name}! 🌟`,
    origin: {
      name: prefs.origin,
      lat: origCoords.lat,
      lng: origCoords.lng,
    },
    destination: {
      name: destCoords.name,
      country: destCoords.country || 'Global Destination',
      lat: destCoords.lat,
      lng: destCoords.lng,
    },
    durationDays: daysCount,
    travelers: prefs.travelers,
    travelStyle: prefs.travelStyle,
    budgetLevel: prefs.budgetLevel,
    currency: currencySymbol,
    overview: `Get ready for an unforgettable journey from ${prefs.origin} to ${destCoords.name}! Designed to be super easy, exciting, and completely stress-free for ${prefs.travelers} traveler(s). Every day is thoughtfully balanced with famous must-see places, delicious food stops, and plenty of time to relax and take photos.`,
    days,
    costBreakdown: {
      flights: totalFlight,
      accommodation: totalStay,
      activities: totalAct,
      foodDining: totalFood,
      localTransit: totalTransit,
      emergencyBuffer: buffer,
      totalEstimatedCost: totalFlight + totalStay + totalAct + totalFood + totalTransit + buffer,
      currency: currencySymbol,
    },
    weatherAdvisory: {
      temperatureRange: '20°C – 26°C (68°F – 79°F)',
      season: 'Pleasant & Sunny Weather ☀️',
      conditionSummary: 'Expect bright, cheerful skies and refreshing breezes perfect for exploring outdoors.',
      rainLikelihood: '10% – Very low chance of rain',
      whatToWear: 'T-shirts, comfortable shorts or jeans, sunglasses, and good walking shoes!'
    },
    smartAdvisory: {
      safetyIndex: 'Super Safe & Welcoming (92/100) 👍',
      visaInfo: 'Most tourists can visit easily with a standard tourist visa or visa-on-arrival.',
      tapWater: 'Safe and clean in hotels; carry a refillable water bottle!',
      tippingCulture: 'Leaving a small tip (5–10%) or rounding up the bill is a nice way to say thank you!',
      emergencyNumbers: 'Police & Medical Emergency: 112 or 911',
      connectivityAdvice: 'Free Wi-Fi is available in hotels and cafes, or grab an easy tourist eSIM card.',
      localEtiquette: [
        'Always smile and say "Hello" in the local language—locals love it!',
        'Keep your ticket safe until you leave trains and buses.',
        'Throw trash in the proper recycling bins to keep the city beautiful.'
      ]
    },
    packingList: [
      { id: 'p1', item: 'Passport & Travel Tickets 🛂', category: 'Documents', packed: true },
      { id: 'p2', item: 'Comfy Sneakers for Walking 👟', category: 'Clothing', packed: true },
      { id: 'p3', item: 'Phone & Camera Charger 🔌', category: 'Electronics', packed: false },
      { id: 'p4', item: 'Cool Sunglasses & Sun Hat 🕶️', category: 'Clothing', packed: false },
      { id: 'p5', item: 'Refillable Water Bottle 💧', category: 'Essentials', packed: false },
      { id: 'p6', item: 'Toothbrush & Travel Toiletries 🪥', category: 'Toiletries', packed: false },
      { id: 'p7', item: 'Portable Power Bank for Phone 🔋', category: 'Electronics', packed: false },
      { id: 'p8', item: 'Light Jacket or Hoodie for Evenings 🧥', category: 'Clothing', packed: false },
      { id: 'p9', item: 'Pocket Money & Travel Card 💳', category: 'Essentials', packed: false }
    ],
    flightIntelligence: {
      distanceKm: dist,
      directFlightHours: flightHours,
      carbonEstimateKg: Math.round(dist * 0.11),
      bestBookingLeadTime: 'Book 1 to 2 months early to get the best airplane window seats!'
    }
  };
}
