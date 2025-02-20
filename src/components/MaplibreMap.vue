<template>
  <div class="map-container">
    <!-- Sidebar for Property Details -->
    <div class="sidebar" v-if="selectedProperty">
      <button class="close-btn" @click="selectedProperty = null">✖</button>
      <h2>Parcel: {{ selectedProperty.PARCEL_NUM }}</h2>
      <p><strong>Address:</strong> {{ selectedProperty.ADDRESS || 'N/A' }}</p>
      <p><strong>Municipality:</strong> {{ selectedProperty.MUNICIPALI || 'N/A' }}</p>
      <p><strong>Deed Area:</strong> {{ selectedProperty.DEED_AREA || 'N/A' }}</p>
      <p><strong>Owner:</strong> {{ selectedProperty.OWNER1 || 'N/A' }} 
         <span v-if="selectedProperty.OWNER2"> & {{ selectedProperty.OWNER2 }}</span>
      </p>
      <p><strong>Reason:</strong> {{ selectedProperty.Reason || 'N/A' }}</p>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map"></div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default {
  setup() {
    const mapContainer = ref(null);
    const map = ref(null);
    const selectedProperty = ref(null);

    // List of GeoJSON files with styling info
    const geojsonFiles = [
      // {
      //   name: 'properties',
      //   url: '/open-areas-inventory-map/data/properties.geojson',
      //   layerType: 'outline',
      //   lineColor: '#000000',
      // },
      {
        name: 'properties',
        url: '/open-areas-inventory-map/data/properties.geojson', // Use real properties file
        layerType: 'fill',
        styleByAttribute: 'Reason', // Use "Reason" for styling
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
        // layerType: 'fill',
        // styleByAttribute: 'LUP1CATN',
        // colorMapping: {
        //   Wooded: '#66cc66',
        //   Water: '##0090b6',
        //   Agriculture: '#99ccff',
        // },
      },
      {
        name: 'borough',
        url: '/open-areas-inventory-map/data/borough.geojson',
        layerType: 'outline',
        lineColor: '#000000',
        lineWidth: 3,
      },
    ];

    // Define max map bounds
    const bounds = [
        [-75.167558, 40.286788], // Southwest coordinates
        [-75.084817, 40.343006] // Northeast coordinates
    ];

    onMounted(async () => {
      // Initialize MapLibre map
      map.value = new maplibregl.Map({
        container: mapContainer.value,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-75.1299, 40.3101],
        zoom: 14,
        maxBounds: bounds,
      });

      // Add navigation controls
      const nav = new maplibregl.NavigationControl();
      map.value.addControl(nav, 'top-right');

      // Load each GeoJSON file dynamically
      map.value.on('load', async () => {
        for (const file of geojsonFiles) {
          const response = await fetch(file.url);
          const geojsonData = await response.json();

          // Add GeoJSON source
          map.value.addSource(file.name, {
            type: 'geojson',
            data: geojsonData,
          });

          // Handle different layer types
          if (file.layerType === 'outline') {
            // Borough is a polygon, but we only want to display its outline
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
                  ...Object.entries(file.colorMapping).flat(), // Convert object to match expression
                  '#aaaaaa', // Default color if no match
                ],
                'fill-opacity': 0.5,
                'fill-outline-color': '#000000',
              },
            });

            // Add popup for property details
            // if (file.name === 'properties') {
            //   map.value.on('click', `${file.name}-polygons`, (e) => {
            //     const coordinates = e.lngLat;
            //     const properties = e.features[0].properties;

            //     new maplibregl.Popup()
            //       .setLngLat(coordinates)
            //       .setHTML(`
            //         <p>Parcel: ${properties.PARCEL_NUM}</p>
            //         <p>Owner: ${properties.OWNER1 || 'Unknown'}</p>
            //         <p>${properties.Reason || 'No details available'}</p>
            //       `)
            //       .addTo(map.value);
            //   });
            // }

            // Click event: Update sidebar instead of opening a popup
            if (file.name === 'properties') {
              map.value.on('click', `${file.name}-polygons`, (e) => {
                selectedProperty.value = e.features[0].properties;
              });

              // Change cursor on hover
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

    return { mapContainer, selectedProperty };
  },
};
</script>

<style>
/* Map container */
.map-container {
  display: flex;
  width: 100%;
  height: 100vh;
}

/* Sidebar styles */
.sidebar {
  width: 300px;
  background: #fff;
  padding: 15px;
  border-right: 2px solid #ccc;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar h2 {
  margin-top: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  float: right;
  cursor: pointer;
}

.close-btn:hover {
  color: red;
}

/* Map area */
.map {
  flex-grow: 1;
}
</style>
