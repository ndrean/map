import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.Suspense fallback={<h1>Loading</h1>}>
  <App />
  // </React.Suspense>
);
