import Leaflet from './map';
import './App.css';
import React from 'react';
import { useSnapshot } from 'valtio';

import { gps } from './geolocate';

function App() {
  const { current } = useSnapshot(gps);

  return (
    <React.Suspense fallback={<h1>Loading</h1>}>
      <div style={{ height: '800px' }}>
        {current && <Leaflet coord={current} />}
      </div>
    </React.Suspense>
  );
}

export default App;
