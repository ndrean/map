import React, { useEffect, useRef } from 'react';
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
// 'AAPKaeb3b038c0ee4b42944272b6481bb84bQCRgtRYdpCkEkfNQvCJt_G2Ww9JeYZ2yEYcD3U5fvx5nZ0u4aP5E6LG8JbPhsacp';

const Map = ({ initCoord: { lat, lng } }) => {
  const { pcoords } = useSnapshot(place);

  const mapElement = useRef(null);

  useEffect(() => {
    const mapRef = mapElement.current;
    if (!mapRef) {
      return;
    }

    const map = L.map(mapRef).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const hereIam = L.latLng(lat, lng);
    L.marker(hereIam).addTo(map).bindPopup(`<h1>${hereIam.toString()}</h1>`);

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
        <button type="button" class="remove">Remove</button>
        `;
      }
    }

    function marker(e) {
      const mark = new L.marker(e.latlng, { draggable: true });
      mark.addTo(map).bindPopup(html(e.latlng));

      mark.on('popupopen', () => openMarker(mark));
      mark.on('dragend', () => draggedMarker(mark));
    }

    function openMarker(mark) {
      const location = mark.getLatLng();

      console.log(place.pcoords.push(location));
      mark.bindPopup(html(location));

      document.querySelector('.remove').addEventListener('click', () => {
        map.removeLayer(mark);
      });

      document.querySelector('.reverse').addEventListener('click', () => {
        discover(mark);
      });
    }

    function draggedMarker(mark) {
      console.log('dragged', mark.getLatLng());

      return mark.bindPopup(html(mark.getLatLng()));
    }

    // const layerGroup = L.layerGroup().addTo(map);

    // map.on('click', function (e) {
    function discover(mark) {
      const location = mark.getLatLng();
      ELG.reverseGeocode({
        apikey: apiKey,
      })
        // .latlng(e.latlng)
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
          /*
          const lngLatString = `${
            Math.round(result.latlng.lng * 100000) / 100000
          }, ${Math.round(result.latlng.lat * 100000) / 100000}`;

          layerGroup.clearLayers();
          marker = L.marker(result.latlng)
            .addTo(layerGroup)
            .bindPopup(
              `<b>${lngLatString}</b><p>${result.address.Match_addr}</p>`
            )
            .openPopup();
            */
        });
    }

    return () => mapRef.remove();
  }, [lat, lng]);

  return (
    <>
      <div style={{ height: '100%' }} ref={mapElement} />
      <p>{JSON.stringify(pcoords)}</p>
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
export default Map;
