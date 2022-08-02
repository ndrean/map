import { Map } from './map';
// import { SearchForm } from './searchForm';
import './App.css';
import React from 'react';

import { gps, useSnapshot } from './geolocate';

function App() {
  const { current } = useSnapshot(gps);

  return (
    <React.Suspense fallback={<h1>Loading</h1>}>
      <div style={{ height: '400px' }}>
        {current && <Map initCoord={current} />}
      </div>
      {/* <SearchForm /> */}
    </React.Suspense>
  );
}

export default App;
