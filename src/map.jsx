import React, { useLayoutEffect, useRef } from 'react';
import { useSnapshot, proxy } from 'valtio';

import * as L from 'leaflet';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import * as ELG from 'esri-leaflet-geocoder';
import 'leaflet-geosearch/dist/geosearch.css';

import { GeoSearchControl } from 'leaflet-geosearch';
import { EsriProvider } from 'leaflet-geosearch';

const place = proxy({
  pcoords: [],
});

const apiKey = process.env.REACT_APP_KEY;

const Map = ({ initCoord: { lat, lng } }) => {
  const { pcoords } = useSnapshot(place);

  const mapElement = useRef(null);

  useLayoutEffect(() => {
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
      .bindPopup(`<h1>${hereIam.toString()}</h1>`);

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

    function marker(e) {
      const location = e.latlng;
      const mark = new L.marker(location, { draggable: true });
      mark.addTo(layerGroup).bindPopup(html(e.latlng));
      const id = mark._leaflet_id;
      location.id = id;
      if (place.pcoords.find((c) => c.id === id) === undefined)
        place.pcoords.push(e.latlng);

      mark.on('popupopen', () => openMarker(mark));
      mark.on('dragend', () => draggedMarker(mark));
    }

    function openMarker(mark) {
      const location = mark.getLatLng();
      const id = mark._leaflet_id;

      mark.bindPopup(html(location));

      document.querySelector('.remove').addEventListener('click', () => {
        place.pcoords = place.pcoords.filter((c) => c.id !== id) || [];
        layerGroup.removeLayer(mark);
      });

      document.querySelector('.reverse').addEventListener('click', () => {
        return discover(mark);
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

    function discover(mark) {
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
        });
    }

    return () => {
      layerGroup.clearLayers();
      mapRef.remove();
    };
  }, [lat, lng]);

  return (
    <>
      <div style={{ height: '100%' }} ref={mapElement} />
      <p>{pcoords && pcoords.map((c) => JSON.stringify(c))}</p>
    </>
  );
};

/*
function is_duplicate(coords, coord) {
  console.log(coords.length);
  console.log(coord);
  const res = coords.find((c) => c.lat === coord.lat && c.lng === coord.lng);
  console.log(res);
  console.log(res.length);
  return coords.find((c) => c.lat === coord.lat && c.lng === coord.lng).length >
    0
    ? true
    : false;
}

function remove(coords, coord) {
  return (coords = coords.find(
    (c) => c.lat !== coord.lat && c.lng !== coord.lng
  ));
}
*/
function searchControl(map) {
  const provider = new EsriProvider();
  return new GeoSearchControl({
    provider: provider,
    style: 'button',
    notFoundMessage: 'Sorry, that address could not be found.',
  });
}
export default Map;
