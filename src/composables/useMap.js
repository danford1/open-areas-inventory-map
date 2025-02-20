import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

export function useMap(mapContainer) {
  const map = ref(null);
  const selectedProperty = ref(null);

  const geojsonFiles = [
    {
      name: 'properties',
      url: '/open-areas-inventory-map/data/properties.geojson',
      layerType: 'fill',
      styleByAttribute: 'Reason',
      colorMapping: {
        'Borough owned, Municipal Park, Riparian Buffer': '#ff6600',
        'Borough owned, Municipal Open Space': '#0066ff',
        'Bucks County Municipal Open Space Program Easement (Preserved)': '#00cc66',
      },
    },
    {
      name: 'landuse',
      url: '/open-areas-inventory-map/data/landuse.geojson',
      layerType: 'outline',
      lineColor: '#ffffff',
      lineWidth: 1,
    },
    {
      name: 'borough',
      url: '/open-areas-inventory-map/data/borough.geojson',
      layerType: 'outline',
      lineColor: '#000000',
      lineWidth: 3,
    },
  ];

  const bounds = [
    [-75.167558, 40.286788],
    [-75.084817, 40.343006],
  ];

  onMounted(async () => {
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-75.1299, 40.3101],
      zoom: 14,
      maxBounds: bounds,
    });

    const nav = new maplibregl.NavigationControl();
    map.value.addControl(nav, 'top-right');

    map.value.on('load', async () => {
      for (const file of geojsonFiles) {
        const response = await fetch(file.url);
        const geojsonData = await response.json();

        map.value.addSource(file.name, {
          type: 'geojson',
          data: geojsonData,
        });

        if (file.layerType === 'outline') {
          map.value.addLayer({
            id: `${file.name}-border`,
            type: 'line',
            source: file.name,
            paint: {
              'line-color': file.lineColor,
              'line-width': file.lineWidth,
            },
          });
        } else if (file.layerType === 'fill') {
          map.value.addLayer({
            id: `${file.name}-polygons`,
            type: 'fill',
            source: file.name,
            paint: {
              'fill-color': [
                'match',
                ['get', file.styleByAttribute],
                ...Object.entries(file.colorMapping).flat(),
                '#aaaaaa',
              ],
              'fill-opacity': 0.5,
              'fill-outline-color': '#000000',
            },
          });

          if (file.name === 'properties') {
            map.value.on('click', `${file.name}-polygons`, (e) => {
              selectedProperty.value = e.features[0].properties;

              // Zoom to the selected feature
              const bbox = turf.bbox(e.features[0]);
              map.value.fitBounds(bbox, {
                padding: 100,
              });
            });

            map.value.on('mouseenter', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = 'pointer';
            });
            map.value.on('mouseleave', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = '';
            });
          }
        }
      }
    });
  });

  return { map, selectedProperty };
}
