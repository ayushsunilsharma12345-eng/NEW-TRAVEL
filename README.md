# AI Travel Intelligence Agent (Voyager.AI) ✈️🌍

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-3.8_Flash-orange.svg)](https://ai.google.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-black.svg)](https://threejs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-teal.svg)](https://tailwindcss.com/)

> An autonomous, full-stack web application for smart travel itinerary generation, 3D Earth trajectory modeling, real-time cost breakdown, and conversational AI travel assistance powered by Google Gemini and Three.js.

---

## 📌 Abstract & Academic Summary

The **AI Travel Intelligence Agent** is an intelligent web-based travel assistance and planning system designed to simplify and improve the travel planning process. Combining modern frontend interfaces with  and Three.js WebGL graphics, the system analyzes travelers' constraints—origin, destination, duration, group size, travel style, and budget preferences—to generate comprehensive multi-day itineraries with granular time-slotted activities, realistic localized budgets, weather advisories, emergency numbers, cultural etiquette, and dynamic packing checklists.

The interactive 3D Global Intel Sphere visualizes destinations on a procedural Earth model with curved sub-orbital flight trajectory arcs, offering an immersive alternative to conventional static travel websites.

---

## 🚀 Key Features & High-Spec Architecture

### 1. 🌐 Interactive 3D Travel Globe (Three.js WebGL)
- **Procedural Earth Sphere**: Zero external image textures; renders continents, atmospheric glow, coordinate rings, and contact grounding shadows directly via Canvas/WebGL.
- **Flight Trajectory Arcs**: Dynamic quadratic Bézier 3D curves between departure airports and target destinations with animated pulse pulses.
- **Camera Kinematics**: Frame-rate independent exponential damping (`THREE.MathUtils.damp`), software-WebGL guard, and orbit controls.
- **Collapsible Bottom Dock**: Ergonomic layout adhering to zero-viewport-occlusion principles.

### 2. ⚡ AI-Powered Itinerary Engine (Google Gemini 3.8 Flash)
- **Day-by-Day Scheduling**: Time-blocked activity plans (Morning, Afternoon, Evening, Night) with location neighborhoods, insider tips, and costs.
- **Cost Optimizer & Breakdown**: Categorized budgeting for flights, accommodations, dining, activities, local transfers, and an emergency contingency buffer.
- **Live Environmental & Weather Advisory**: Temperature ranges, seasonal conditions, rainfall probability, and packing recommendations.
- **Smart Traveler Advisory**: Safety indices, visa/entry requirements, tap water advisories, tipping customs, and local etiquette rules.
- **Interactive Packing Checklist**: Categorized gear checklist with progress tracking and custom item addition.

### 3. 💬 Conversational Travel Agent Assistant
- Floating real-time AI assistant panel with suggested prompt chips ("How to do Tokyo under $1200", "Hidden food streets in Rome", "Packing advice for Bali").
- Markdown responses, 1-click clipboard copying, and contextual follow-up recommendations.

### 4. 🗂️ Local Trips Library & Report Exporting
- **Print / PDF Ready**: Dedicated print stylesheet (`@media print`) that formats multi-day itineraries into publication-ready travel briefs.
- **LocalStorage Persistence**: Saves generated trips locally for instant offline access.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Tailwind CSS v4, Motion |
| **3D Graphics & WebGL**| Three.js, RoomEnvironment, CanvasTexture |
| **Audio Feedback** | Web Audio API (procedural synthesizers, 0 external audio files) |
| **Backend Server** | Express.js, Node.js, TSX |
| **AI / Generative Model** | Google GenAI SDK (`@google/genai`), `gemini-3.8-flash` |
| **Build & Tooling** | Vite, ESBuild |

---

## 📦 Project Structure

```
├── server.ts                       # Express full-stack entry point & Gemini API endpoints
├── index.html                      # SEO metadata & HTML entry
├── package.json                    # Dependencies & npm scripts
├── vite.config.ts                  # Vite configuration & alias mappings
├── tsconfig.json                   # TypeScript compiler settings
├── src/
│   ├── App.tsx                     # Main application container & view routing
│   ├── main.tsx                    # React DOM root entry
│   ├── index.css                   # Tailwind v4 imports, custom scrollbar & print styles
│   ├── types/
│   │   └── travel.ts               # Complete TypeScript interfaces
│   ├── data/
│   │   └── popularDestinations.ts  # Curated destinations & airport coordinates
│   ├── services/
│   │   └── api.ts                  # Client-side API fetch client
│   ├── utils/
│   │   └── audio.ts                # Web Audio API sound synthesizer
│   └── components/
│       ├── Globe/
│       │   └── TravelGlobe.tsx     # Three.js 3D Earth, pins & flight arcs
│       ├── TripPlanner/
│       │   ├── TripPlannerForm.tsx # Input form with style/budget presets
│       │   └── ItineraryView.tsx   # Multi-day schedule, budget charts & packing list
│       ├── DestinationExplorer/
│       │   └── DestinationCards.tsx# Curated world hub showcase & search
│       ├── AIAssistant/
│       │   └── AgentChat.tsx       # Interactive AI assistant panel
│       └── SavedTrips/
│           └── SavedTripsModal.tsx # Stored itineraries manager
```

---

## ⚙️ Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ayushsunilsharma12345-eng/FINAL-TRAVEL-ASSISTANT.git
   cd FINAL-TRAVEL-ASSISTANT
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
   PORT=3000
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📄 License

This project is licensed under the Apache 2.0 License.
