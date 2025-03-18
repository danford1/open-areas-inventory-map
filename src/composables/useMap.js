// TODO:
// - remove cyan outline when clicking on a different parcel
// - add riparian buffer layer


import { ref, onMounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';

export function useMap(mapContainer) {
  const map = ref(null);
  const selectedProperty = ref(null);
  const layerVisibility = ref({});  // Add this to store visibility states

  const geojsonFiles = [
    {
      name: 'properties',
      url: '/open-areas-inventory-map/data/properties.geojson',
      layerType: 'fill',
      styleByAttribute: 'Reason',
      colorMapping: {
        'Borough owned, Municipal Park, Riparian Buffer': '#000000',
        'Borough owned, Municipal Open Space': '#000000',
        'Bucks County Municipal Open Space Program Easement (Preserved)': '#000000',
      },
      lineColor: '#000000',
      lineWidth: 3,
    },
    {
      name: 'landuse',
      url: '/open-areas-inventory-map/data/landuse.geojson',
      layerType: 'fill',
      styleByAttribute: 'LUP1CATN',
      colorMapping: {
        'Agriculture': '#979c89',
        'Commercial': '#7e6d42',
        'Community Services': '#536d37',
        'Manufacturing': '#6c6c6c',
        'Military': '#6c6c6c',
        'Mining': '#6c6c6c',
        'Parking: Agriculture': '#4f4f4f',
        'Parking: Commercial': '#4f4f4f',
        'Parking: Community Services': '#4f4f4f',
        'Parking: Manufacturing': '#4f4f4f',
        'Parking: Military': '#4f4f4f',
        'Parking: Mining': '#4f4f4f',
        'Parking: Mobile Home': '#4f4f4f',
        'Parking: Multi-Family': '#4f4f4f',
        'Parking: Recreation': '#4f4f4f',
        'Parking: Transportation': '#4f4f4f',
        'Parking: Utility': '#4f4f4f',
        'Recreation': '#337759',
        'Residential: Mobile Home': '#738e7c',
        'Residential: Multi-Family': '#738e7c',
        'Residential: Single-Family': '#738e7c',
        'Transportation': '#6d6d6d',
        'Utility': '#8f8467',
        'Vacant': '#8b866d',
        'Water': '#0090b6',
        'Wooded': '#225e44',        
      },
    },
    {
      name: 'streams',
      url: '/open-areas-inventory-map/data/streams.geojson',
      layerType: 'outline',
      lineColor: '#0090b6',
      lineWidth: 3,
    },
    {
      name: 'borough',
      url: '/open-areas-inventory-map/data/borough.geojson',
      layerType: 'outline',
      lineColor: '#ffffff',
      lineWidth: 3,
    },
  ];

  const bounds = [
    [-75.167558, 40.286788],
    [-75.084817, 40.343006],
  ];

  const mapStyles = {
    satellite: {
      version: 8,
      sources: {
        'esri-imagery': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
        },
        'esri-hybrid-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Labels &copy; <a href="https://www.esri.com/">Esri</a>',
        },
      },
      layers: [
        {
          id: 'esri-imagery-layer',
          type: 'raster',
          source: 'esri-imagery',
        },
        {
          id: 'esri-hybrid-labels-layer',
          type: 'raster',
          source: 'esri-hybrid-labels',
        },
      ],
    },
    default: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
        },
      ],
    },
    nearmap2020: {
      version: 8,
      sources: {
        'nearmap-2020': {
          type: 'raster',
          tiles: [
            'https://imagery.pasda.psu.edu/arcgis/rest/services/pasda/DVRPC2020/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:0&bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&f=image'
          ],
          tileSize: 256,
          attribution: '&copy; 2020 Nearmap, DVRPC',
          scheme: 'xyz',
        },
        'esri-hybrid-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Labels &copy; <a href="https://www.esri.com/">Esri</a>',
        },
      },
      layers: [
        {
          id: 'nearmap-2020-layer',
          type: 'raster',
          source: 'nearmap-2020',
        },
        {
          id: 'esri-hybrid-labels-layer',
          type: 'raster',
          source: 'esri-hybrid-labels',
        },
      ],
    },
  };

  const setLayerVisibility = (layerId, visible) => {
    layerVisibility.value[layerId] = visible;
    if (map.value.getLayer(layerId)) {
      map.value.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  };

  const applyStoredVisibility = () => {
    Object.entries(layerVisibility.value).forEach(([layerId, visible]) => {
      if (map.value.getLayer(layerId)) {
        map.value.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
  };

  const togglePropertyLayers = (visible) => {
    if (map.value) {
      ['properties-polygons', 'properties-border'].forEach(layerId => {
        if (map.value.getLayer(layerId)) {
          map.value.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      });
    }
  };

  const setBoroughBounds = async () => {
    const response = await fetch('/open-areas-inventory-map/data/borough.geojson');
    const geojsonData = await response.json();
    const bbox = turf.bbox(geojsonData);
    const padding = 0.01; // About 1km of padding
    return [
      [bbox[0] - padding, bbox[1] - padding],
      [bbox[2] + padding, bbox[3] + padding]
    ];
  };

  onMounted(async () => {
    const bounds = await setBoroughBounds();
    
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: mapStyles.default,
      bounds: bounds,
      maxBounds: bounds,
      padding: 50
    });

    const nav = new maplibregl.NavigationControl();
    map.value.addControl(nav, 'top-right');

    const addGeojsonLayers = async () => {
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

          if (file.name === 'borough') {
            map.value.addLayer({
              id: `${file.name}-border-outer`,
              type: 'line',
              source: file.name,
              paint: {
                'line-color': '#ffffff',
                'line-width': 6,
              },
            });

            map.value.addLayer({
              id: `${file.name}-border-inner`,
              type: 'line',
              source: file.name,
              paint: {
                'line-color': '#000000',
                'line-width': 2,
                'line-dasharray': [3, 3],
              },
            });
          }

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
              'fill-opacity': 0.4,
              'fill-outline-color': '#ffffff',
            },
          });

          if (file.name === 'properties') {

            map.value.addLayer({
              id: `${file.name}-polygons`,
              type: 'fill',
              source: file.name,
              paint: {
                'fill-color': [
                  'match',
                  ['get', file.styleByAttribute],
                  ...Object.entries(file.colorMapping).flat(),
                  '#000000',
                ],
                'fill-opacity': 0.1,
                'fill-outline-color': '#000000',
              },
            });

            map.value.addLayer({
              id: `${file.name}-border`,
              type: 'line',
              source: file.name,
              paint: {
                'line-color': file.lineColor,
                'line-width': file.lineWidth,
              },
            });

            map.value.on('click', `${file.name}-polygons`, (e) => {
              selectedProperty.value = e.features[0].properties;

              // Hide property layers
              togglePropertyLayers(false);

              // Zoom to the selected feature
              const bbox = turf.bbox(e.features[0]);
              map.value.fitBounds(bbox, {
                padding: 150,
              });

              // Add a thick cyan outline to the selected parcel
              if (map.value.getLayer('selected-parcel-outline')) {
                map.value.removeLayer('selected-parcel-outline');
                map.value.removeSource('selected-parcel-outline');
              }

              map.value.addSource('selected-parcel-outline', {
                type: 'geojson',
                data: e.features[0],
              });

              map.value.addLayer({
                id: 'selected-parcel-outline',
                type: 'line',
                source: 'selected-parcel-outline',
                paint: {
                  'line-color': '#00FFFF',
                  'line-width': 4,
                },
              });
            });

            map.value.on('mouseenter', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = 'pointer';
            });
            map.value.on('mouseleave', `${file.name}-polygons`, () => {
              map.value.getCanvas().style.cursor = '';
            });

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
      
      // After all layers are added, apply stored visibility
      applyStoredVisibility();
    };

    map.value.on('load', addGeojsonLayers);
    map.value.on('styledata', addGeojsonLayers);
  });

  const clearSelectedParcelOutline = () => {
    if (map.value && map.value.getLayer('selected-parcel-outline')) {
      map.value.removeLayer('selected-parcel-outline');
      map.value.removeSource('selected-parcel-outline');
      togglePropertyLayers(true);
    }
  };

  const setMapStyle = (style) => {
    map.value.setStyle(mapStyles[style]);
  };

  return { 
    map, 
    selectedProperty, 
    setMapStyle, 
    clearSelectedParcelOutline,
    setLayerVisibility  // Export the new function
  };
}
