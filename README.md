# Aramco Pipelines — AI Leak Watch

A modern, visually striking demo web application for monitoring oil pipelines with AI-powered leak diagnostics.

## Features

- 🗺️ Interactive map with 100 simulated pipelines across Saudi Arabia
- 🎯 Real-time leak probability calculation based on pressure/flow ratios
- 🤖 AI-powered diagnostics using OpenAI GPT-4o-mini
- 📊 Dynamic threshold slider and KPI dashboard
- 🎨 Premium dark theme with smooth animations
- 📱 Mobile-friendly responsive design
- 🔍 Marker clustering for better visualization

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Leaflet** for interactive maps
- **OpenAI API** for AI diagnostics
- **Zod** for request validation

## Quick Start

### 1. Set up environment variables

Create or update your `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

### 4. Open your browser

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
aramcowebapp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── diagnose/
│   │   │       └── route.ts       # OpenAI API endpoint
│   │   ├── globals.css            # Global styles + Leaflet CSS
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main page
│   ├── components/
│   │   ├── Map.tsx                # React Leaflet map with clustering
│   │   ├── RightDrawer.tsx        # Pipeline details & AI diagnosis
│   │   └── Topbar.tsx             # Header with KPIs and threshold slider
│   ├── lib/
│   │   └── simulatePipelines.ts   # Pipeline data simulation
│   └── types/
│       └── index.ts               # TypeScript type definitions
├── .env                           # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## How It Works

### Leak Probability Formula

The app calculates leak probability using an abnormal pressure-to-flow ratio:

```typescript
leakProb = base_risk + abnormality_score + noise

where:
- base_risk = 0.1 (10% baseline)
- abnormality_score = abs((pressure/flow) - expected_ratio) / expected_ratio
- expected_ratio = 0.05 (normal: ~50 bar / ~1000 m³/h)
- noise = random variation ±0.05
```

### AI Diagnostics

When you click "Generate AI Diagnosis" for a pipeline:
1. The app sends pipeline metrics to `/api/diagnose`
2. The API validates the request using Zod
3. OpenAI GPT-4o-mini analyzes the data
4. Returns a summary and 2-3 recommended actions

## Features in Detail

- **Threshold Slider**: Adjust leak probability threshold (0-100%) to define at-risk pipelines
- **Color-Coded Markers**: Green = normal, Red = at-risk (10% larger for emphasis)
- **Marker Clustering**: Pipelines cluster automatically for better map readability
- **KPI Dashboard**: Real-time counts of total, at-risk, and normal pipelines
- **Interactive Drawer**: Click any pipeline to view detailed metrics and request AI diagnosis
- **Legend**: Bottom-left legend shows marker color meanings

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## Build for Production

```bash
npm run build
npm start
```

## Notes

- The simulation uses a deterministic seed (42) for repeatable demo data
- No external map tokens required (uses OpenStreetMap)
- All 100 pipelines are positioned within Saudi Arabia's geographic bounds
- The app is fully type-safe with no `any` types

## License

Demo project for Aramco pipeline monitoring showcase.
