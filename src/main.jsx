//npm run dev


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';   // ← 确保是 './App.jsx' 而不是 './main.jsx' 自己
import 'leaflet/dist/leaflet.css';
import './index.css';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);