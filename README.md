# Set up

Command used to create the app:

```bash
npx create-react-app map
yarn add leaflet
yarn add leaflet
```

To set up Leaflet, add in "head" of "index.html" (in /public)

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css"
integrity="sha512-hoalWLoI8r4UszCkZ5kL8vayOGVae1oxXe/2A4AO6J9+580uKHDO3JdHb7NzwwzK5xr/Fs0W40kiNHxM9vyTtQ=="
crossorigin=""/>
```

For the search control form, add in "head" after Leaflet:

```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet-geosearch@3.0.0/dist/geosearch.css" />
```

- GeoSearch: <https://github.com/smeijer/leaflet-geosearch>
- Esri: <https://smeijer.github.io/leaflet-geosearch/providers/esri>
- eee autocomplet with Pelias: <https://github.com/pelias/documentation/blob/master/autocomplete.md>
