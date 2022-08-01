import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const Leaflet = ({ coord: { lat, lng } }) => {
  const mapElement = useRef(null);

  useEffect(() => {
    const mapRef = mapElement.current;
    if (!mapRef) {
      return;
    }

    const map = L.map(mapElement.current).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    return () => mapRef.remove();
  }, [lat, lng]);

  return <div style={{ height: '100%' }} ref={mapElement} />;
};

export default Leaflet;
