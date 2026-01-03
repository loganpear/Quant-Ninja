# 🥷 Quant Ninja: Vision-Powered +EV Betting Simulator

Quant Ninja is a high-performance sports betting paper-trading platform that uses **Gemini 3 Vision AI** to bridge the gap between betting dashboards and your ledger.

## 🚀 Key Features

- **Ninja Vision**: Establish a live "Uplink" to any browser tab (like Crazy Ninja Odds). The AI scans the viewport every 10 seconds to identify +EV (Positive Expected Value) markets.
- **Autonomous Ledger**: Identified bets are automatically calculated using a **Conservative Quarter-Kelly Criterion** and logged to your personal ledger.
- **Smart Settlement**: Uses Google Search grounding to verify the outcomes of pending bets and automatically update your bankroll.
- **Cash-Flow Accounting**: Professional-grade bankroll management that subtracts "Risk Exposure" (pending stakes) immediately from available cash.

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons
- **AI Engine**: Google Gemini 3 (Pro & Flash)
- **Vision**: Browser MediaDevices API (Screen Capture)
- **Accounting**: Kelly Criterion Risk Management

## 🚦 Getting Started

1. **API Key**: This application requires a Google Gemini API Key.
2. **Environment**: The key should be provided via `process.env.API_KEY`.
3. **Usage**:
   - Navigate to **Ninja Vision**.
   - Click **Establish Link** and select the tab containing your odds dashboard.
   - Watch the **Agent Terminal** as the AI identifies and logs profitable trades.

---
*Disclaimer: This is a simulation and paper-trading tool intended for educational purposes only. It does not place real-money bets.*
