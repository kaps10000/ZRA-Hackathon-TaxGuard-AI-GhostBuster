# 🎯 TaxGuard AI GhostBuster - Frontend Dashboard

Modern React + TypeScript dashboard for the TaxGuard blockchain-powered tax compliance system.

## 🚀 Features

- **Real-time Dashboard** - Live event monitoring and system statistics
- **Module Navigation** - Dedicated interfaces for each system module:
  - 🔍 **GhostBuster** - Phantom employee detection
  - 📢 **WhistlePro** - Anonymous whistleblower reports  
  - 🧠 **AI Risk** - ML-powered risk assessments
  - 📊 **Predictive** - Forecasting and analytics
- **Blockchain Integration** - Direct API connection to blockchain gateway
- **Modern UI** - Built with TailwindCSS and shadcn/ui components
- **TypeScript** - Full type safety and IntelliSense

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Fast development and building
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Axios** - API client for blockchain integration
- **Lucide React** - Modern icon library

## 🏃‍♂️ Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔗 API Integration

The dashboard connects to the blockchain API gateway at `http://localhost:3001/api` with endpoints for all modules.

## 👥 Team Integration

This frontend serves as the central dashboard for all team modules while maintaining a consistent user experience.

---

**Built for ZRA Hackathon 2025** 🏆

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
