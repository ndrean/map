// import React, { useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { derive } from 'valtio/utils';

const initPos = { lat: 42.2808, lng: -83.743 };

const gps = proxy({
  initPos: initPos,
  current: null,
});

derive({
  derPos: async (get) => {
    if (!navigator.geolocation) return (get(gps).initPos = initPos);

    navigator.geolocation.getCurrentPosition(success, fail);
    function fail(e) {
      return e;
    }
    function success({ coords: { latitude, longitude } }) {
      get(gps).current = { lat: latitude, lng: longitude };
    }
  },
});

export { gps, useSnapshot };
