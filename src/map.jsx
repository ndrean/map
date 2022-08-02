import React, { useRef } from 'react';
import { useSnapshot, proxy } from 'valtio';

import * as L from 'leaflet';
import 'esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css';
import * as ELG from 'esri-leaflet-geocoder';
import 'leaflet-geosearch/dist/geosearch.css';

import { GeoSearchControl } from 'leaflet-geosearch';
import { EsriProvider } from 'leaflet-geosearch';

export const place = proxy({
  coords: [],
  distance: 0,
});

const apiKey = process.env.REACT_APP_KEY;

export const Map = ({ initCoord: { lat, lng } }) => {
  const { coords } = useSnapshot(place);
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

    /*
    const hereIam = L.latLng(lat, lng);
    L.marker(hereIam)
      .addTo(layerGroup)
      .bindPopup(`<h1>${hereIam.toString()}</h1>`);
    */

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
    const lineLayer = L.geoJSON();

    function marker(e) {
      const location = e.latlng;
      const mark = new L.marker(location, { draggable: true });
      mark.addTo(layerGroup).bindPopup(html(e.latlng));
      const id = mark._leaflet_id;
      location.id = id;

      if (place.coords.find(c => c.id === id) === undefined)
        place.coords.push(location);

      mark.on('popupopen', () => openMarker(mark, id));
      mark.on('dragend', () => draggedMarker(mark, id, lineLayer));

      drawLine(lineLayer);
    }

    function drawLine(lineLayer) {
      const [start, end, ...rest] = place.coords;
      if (start && end) {
        const p1 = L.latLng([start.lat, start.lng]);
        const p2 = L.latLng([end.lat, end.lng]);

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

    function openMarker(mark, id) {
      const getLocation = place.coords.find(c => c.id === id);
      mark.bindPopup(html(getLocation));

      document.querySelector('.remove').addEventListener('click', () => {
        place.coords = place.coords.filter(c => c.id !== id) || [];
        place.distance = 0;
        layerGroup.removeLayer(mark);
        const line = document.querySelector('.leaflet-interactive');
        if (line) line.remove();
      });

      document.querySelector('.reverse').addEventListener('click', () => {
        return reverse(mark, id);
      });
    }

    function draggedMarker(mark, id, lineLayer) {
      document.querySelector('.leaflet-interactive').remove();
      const currentCoords = mark.getLatLng();
      const dragged = place.coords.find(c => c.id === id);
      dragged.lat = currentCoords.lat;
      dragged.lng = currentCoords.lng;
      // place.coords = place.coords.filter(c => c.id !== id);
      // place.coords.push(dragged);
      mark.bindPopup(html(currentCoords));
      drawLine(lineLayer);
      follow(currentCoords, id);
    }

    function follow(location, id) {
      return new Promise((resolve, reject) => {
        resolve(
          ELG.reverseGeocode({ apikey: apiKey })
            .latlng(location)
            .run(function (error, result) {
              if (error) {
                return;
              }
              const newCoord = place.coords.find(c => c.id === id);
              newCoord.addr = result.address.Match_addr;
              // place.coords = place.coords.filter(c => c.id !== id);
              // place.coords.push(newCoord);
            })
        );
      });
    }

    function reverse(mark, id) {
      const location = mark.getLatLng();
      ELG.reverseGeocode({ apikey: apiKey })
        .latlng(location)
        .run(function (error, result) {
          if (error) {
            return;
          }

          const {
            address: { Match_addr },
            latlng: { lat, lng },
          } = result;
          mark.bindPopup(html({ lat, lng, Match_addr })).openPopup();
          const discovered = place.coords.find(c => c.id === id);
          discovered.addr = Match_addr;
          // place.coords = place.coords.filter(c => c.id !== id);
          // place.coords.push(discovered);
        });
    }

    return () => {
      layerGroup.clearLayers();
      mapRef.remove();
    };
  }, [lat, lng]);

  console.log('render');
  return (
    <>
      <div style={{ height: '100%' }} ref={mapElement} />
      <div>
        <table>
          <thead>
            <tr>
              <th>Lat</th>
              <th>Long</th>
              <th>Found address</th>
            </tr>
          </thead>
          <tbody>
            {coords && coords.map(c => <Row coord={c} key={c.id} />)}
          </tbody>
        </table>
      </div>
      <p>distance: {distance}</p>
    </>
  );
};

function Row({ coord }) {
  return (
    <tr key={coord.id}>
      <td>{coord.lat.toFixed(2)}</td>
      <td>{coord.lng.toFixed(2)}</td>
      <td>{coord.addr}</td>
    </tr>
  );
}

function searchControl(map) {
  const provider = new EsriProvider();
  return new GeoSearchControl({
    provider: provider,
    style: 'button',
    notFoundMessage: 'Sorry, that address could not be found.',
  });
}
