<template>
  <div id="map" class="map-container"></div>
</template>

<script>
import maplibregl from 'maplibre-gl';

export default {
  name: 'MaplibreMap',
  mounted() {
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json', // Specify the map style
      center: [-74.5, 40], // Specify the starting position [lng, lat]
      zoom: 9, // Specify the starting zoom
      attributionControl: false // Disable the attribution control
    });
  }
};
</script>

<style>
.map-container {
  width: 100%;
  height: 100vh;
}
</style>
