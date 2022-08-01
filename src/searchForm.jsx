import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { proxy, useSnapshot } from 'valtio';

const store = proxy({ coords: { lat: null, lng: null, address: null } });

const SearchForm = () => {
  const provider = new OpenStreetMapProvider();
  const { coords } = useSnapshot(store);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const location = formData.get('address');
    const results = await provider.search({ query: location });
    if (results.length > 0) {
      const { x, y, label } = results[0];
      store.coords = { lng: x, lat: y, address: label };
      return { lng: x, lat: y, address: label };
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit}>
        <fieldset>
          <label htmlFor='address'>
            Address :
            <input id='address' type='text' name='address' />
          </label>
        </fieldset>
        <input type='submit' value='Search' />
      </form>
      <pre>{JSON.stringify(coords)}</pre>
    </>
  );
};

export { store, SearchForm };
