# 🥷 Quant Ninja: Vision-Powered +EV Betting Simulator

Quant Ninja is a high-performance sports betting paper-trading platform that uses **Gemini 3 Vision AI** to bridge the gap between betting dashboards and your ledger.

## 🚀 Key Features

- **Ninja Vision**: Establish a live "Uplink" to any browser tab. The AI scans the viewport every 10 seconds to identify +EV markets.
- **Autonomous Ledger**: Identified bets are automatically calculated using a **Conservative Quarter-Kelly Criterion** and logged.
- **Fixed Persistence**: Uses a robust `localStorage` implementation with initialization-locks to ensure your data survives refreshes.
- **Smart Settlement**: Uses Google Search grounding to verify the outcomes of pending bets.

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **AI Engine**: Google Gemini 3 (Pro & Flash)
- **Vision**: Browser MediaDevices API (Screen Capture)

## 📦 Vercel Deployment Guide

To host this app on Vercel:

1. **GitHub Sync**: Push this code to a public or private GitHub repository.
2. **Import to Vercel**: Select the repo in the Vercel dashboard.
3. **Set Environment Variables**:
   - Go to **Settings > Environment Variables**.
   - Add `API_KEY`. This is your Gemini API Key from Google AI Studio.
4. **Build Config**: 
   - Preset: `Other`.
   - Output Directory: `.` (Current root).
5. **Permissions**: The app requires HTTPS to use the "Ninja Vision" feature. Vercel provides this automatically.

### 🛡 Security & Privacy
- **Client-Side Only**: All API calls happen from the user's browser.
- **Local Storage**: Your ledger data is stored in your browser's local storage and is never uploaded to a database (unless you specifically modify the persistence layer).

---
*Disclaimer: This is a simulation and paper-trading tool intended for educational purposes only. It does not place real-money bets.*
