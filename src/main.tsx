import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import global styles.  Adjust the path according to your project
// structure or remove if not using TailwindCSS or similar.
import './index.css';
import './mobile.css'; // Mobile-only overrides (max-width: 768px)

// Mount the React application into the root element defined in
// index.html.  Vite's new bundler automatically replaces this at
// build time.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
