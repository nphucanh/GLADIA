import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/bg-scene.css';
import './styles/layout.css';
import './styles/hero-shared.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
