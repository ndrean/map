import React, { useLayoutEffect, useRef } from 'react';
import { useSnapshot, proxy } from 'valtio';

import * as L from 'leaflet';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import * as ELG from 'esri-leaflet-geocoder';
import 'leaflet-geosearch/dist/geosearch.css';

import { GeoSearchControl } from 'leaflet-geosearch';
import { EsriProvider } from 'leaflet-geosearch';

export const place = proxy({
  pcoords: [],
  distance: 0,
});

const apiKey = process.env.REACT_APP_KEY;

export const Map = ({ initCoord: { lat, lng } }) => {
  const { pcoords } = useSnapshot(place);

  const { distance } = useSnapshot(place);

  const mapElement = useRef(null);

  React.useEffect(() => {
    const mapRef = mapElement.current;
    if (!mapRef) {
      return;
    }

    const map = L.map(mapRef).setView([lat, lng], 13);
    const layerGroup = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const hereIam = L.latLng(lat, lng);
    L.marker(hereIam)
      .addTo(layerGroup)
      .bindPopup(`<h1>${hereIam.toString()}</h1>`)
      .openPopup();

    /* search for address */
    map.addControl(searchControl(mapRef));

    map.on('click', marker);

    function html({ lat, lng, Match_addr }) {
      if (!Match_addr) {
        return `
        <h3>Lat: ${lat.toFixed(3)}</h3>
        <h3>Lng: ${lng.toFixed(3)}</h3>
        <button type="button" class="remove">Remove</button>
        <button type="button" class="reverse">Reverse</button>
        `;
      } else {
        return `
        <h3>Lat: ${lat.toFixed(3)}</h3>
        <h3>Lng: ${lng.toFixed(3)}</h3>
        <p>${Match_addr}</p>
        `;
      }
    }

    async function marker(e) {
      const location = e.latlng;
      const mark = new L.marker(location, { draggable: true });
      mark.addTo(layerGroup).bindPopup(html(e.latlng));
      const id = mark._leaflet_id;
      location.id = id;

      if (place.pcoords.find((c) => c.id === id) === undefined)
        place.pcoords.push(location);

      mark.on('popupopen', () => openMarker(mark));
      mark.on('dragend', () => draggedMarker(mark));

      const [start, end, ...rest] = place.pcoords;
      if (start && end) {
        const p1 = L.latLng([start.lat, start.lng]);
        const p2 = L.latLng([end.lat, end.lng]);
        const lineLayer = L.geoJSON().addTo(map);
        lineLayer
          .addData({
            type: 'LineString',
            coordinates: [
              [start.lng, start.lat],
              [end.lng, end.lat],
            ],
          })
          .addTo(map);
        place.distance = (p1.distanceTo(p2) / 1000).toFixed(2);
      }
    }

    function openMarker(mark) {
      const id = mark._leaflet_id;
      const getLocation = place.pcoords.find((c) => c.id === id);
      mark.bindPopup(html(getLocation));

      document.querySelector('.remove').addEventListener('click', () => {
        place.pcoords = place.pcoords.filter((c) => c.id !== id) || [];
        place.distance = 0;
        layerGroup.removeLayer(mark);
        document.querySelector('.leaflet-interactive').remove();
      });

      document.querySelector('.reverse').addEventListener('click', () => {
        return discover(mark, id);
      });
    }

    function draggedMarker(mark) {
      const id = mark._leaflet_id;
      const newCoords = mark.getLatLng();
      const dragged = place.pcoords.find((c) => c.id === id);
      dragged.lat = newCoords.lat;
      dragged.lng = newCoords.lng;
      place.pcoords = place.pcoords.filter((c) => c.id !== id);
      place.pcoords.push(dragged);

      return mark.bindPopup(html(mark.getLatLng()));
    }

    async function discover(mark, id) {
      const location = mark.getLatLng();
      ELG.reverseGeocode({ apikey: apiKey })
        .latlng(location)
        .run(function (error, result) {
          if (error) {
            console.log(error);
            return;
          }

          const {
            address: { Match_addr },
            latlng: { lat, lng },
          } = result;
          mark.bindPopup(html({ lat, lng, Match_addr })).openPopup();
          const discovered = place.pcoords.find((c) => c.id === id);
          discovered.addr = Match_addr;
          place.pcoords = place.pcoords.filter((c) => c.id !== id);
          place.pcoords.push(discovered);
        });
    }

    return () => {
      layerGroup.clearLayers();
      mapRef.remove();
    };
  }, [lat, lng]);

  console.log(pcoords);
  return (
    <>
      <div style={{ height: '100%' }} ref={mapElement} />
      <p>{pcoords && pcoords.map((c) => JSON.stringify(c))}</p>
      <p>{distance}</p>
    </>
  );
};

function searchControl(map) {
  const provider = new EsriProvider();
  return new GeoSearchControl({
    provider: provider,
    style: 'button',
    notFoundMessage: 'Sorry, that address could not be found.',
  });
}

export const Distance = () => {};
