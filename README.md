# 🛠️ CrisisBridge v2: Defense-Grade Crisis Response

![CrisisBridge Hero](crisis_bridge_hero_1776003748917.png)

## Overview

**CrisisBridge v2** is a mission-critical emergency response platform designed for rapid awareness and coordination during domestic and international crises. Migrated from Next.js to a performance-optimized **Vite + React SPA**, it features a "Defense-Grade" tactical UI tailored for high-pressure environments where every second counts.

### 🎯 Objective
To bridge the gap between affected citizens and emergency responders through real-time data ingestion, tactical visualization, and administrative oversight.

---

## ✨ Key Features

- **🛡️ Tactical Command Center**: A data-rich dashboard for administrators to monitor incidents in real-time.
- **📍 Hyper-Local Reporting**: Streamlined guest reporting interface for citizens to submit incident details, location data, and severity levels.
- **📊 Advanced Analytics**: Recharts-powered data visualizations for trend analysis and resource allocation.
- **🔐 Secure Infrastructure**: Built on Supabase for robust authentication and high-performance Postgres backend.
- **⚡ Ultra-Responsive UI**: Built with Tailwind CSS and Framer Motion for smooth, interrupt-free interactions.

---

## 🚀 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State/Backend**: [Supabase](https://supabase.com/) (PostgreSQL & Auth)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Visuals**: [Lucide React](https://lucide.dev/) (Icons), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **Analytics**: [Recharts](https://recharts.org/)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- NPM or PNPM
- A Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd crisis-bridge-v2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
src/
├── components/     # UI Components (Tactical elements, Buttons, Forms)
├── hooks/          # Custom React hooks (Supabase data fetching)
├── layouts/        # Page layouts (Admin, Auth, Guest)
├── pages/          # Full page views (Dashboard, Analytics, Reporting)
├── utils/          # Helper functions and Supabase client
└── lib/            # Shared libraries and design tokens
```

---

## 📜 Deployment

The project is optimized for high-performance static hosting (Vercel, Netlify, or AWS Amplify).

```bash
# Generate production bundle
npm run build

# Preview build locally
npm run preview
```

---

## 👥 Contributors

Built with precision for the **Google Solution Challenge**.

---

> [!IMPORTANT]
> This platform is designed for emergency response coordination. Ensure all API keys are restricted to appropriate origins in the Supabase Dashboard for production use.

