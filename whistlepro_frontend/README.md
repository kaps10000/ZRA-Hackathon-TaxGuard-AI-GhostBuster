# WhistlePro Frontend

**Assigned to: Ephraim**

## Overview
Progressive Web App + Mobile App for anonymous whistleblower reporting.

## Features
- Progressive Web App (PWA)
- Mobile App (React Native/Flutter)
- UI for submitting reports anonymously
- Case code generation + clean reporting interface
- Secure, encrypted communication

## Tech Stack
- **Web**: React.js/Vue.js (PWA)
- **Mobile**: React Native/Flutter
- **UI/UX**: Material-UI/Tailwind CSS
- **Security**: End-to-end encryption integration

## Structure
```
whistlepro_frontend/
├── web_app/
│   ├── components/
│   ├── pages/
│   └── utils/
├── mobile_app/
│   ├── screens/
│   ├── components/
│   └── navigation/
├── shared/
│   ├── api/
│   ├── encryption/
│   └── validation/
└── tests/
```

## Key Features
- Anonymous report submission
- Case ID generation and tracking
- Secure file upload
- Real-time case updates
- Clean, intuitive interface
- Cross-platform compatibility

## Integration Points
- **WhistlePro Backend** (Kelvin) - API integration
- **Blockchain** (Kaps) - Report hash storage
- **Dashboard** (Thomas) - Investigator interface
