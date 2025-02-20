<template>
  <div class="map-container" :class="{ 'sidebar-open': selectedProperty }">

    <Sidebar
      :selectedProperty="selectedProperty"
      @isClosed="selectedProperty = null"
    />
    
    <div ref="mapContainer" class="map"></div>

  </div>
</template>

<script>
import { ref } from 'vue';
import { useMap } from '../composables/useMap';
import Sidebar from './Sidebar.vue';

export default {
  components: {
    Sidebar,
  },
  setup() {
    const mapContainer = ref(null);
    const { map, selectedProperty } = useMap(mapContainer);

    return { mapContainer, selectedProperty };
  },
};
</script>

<style>
.map-container {
  display: flex;
  width: 100%;
  height: 100vh;
  transition: width 0.3s ease;
}

.map-container.sidebar-open .map {
  width: calc(100% - 300px);
}

.map {
  flex-grow: 1;
  transition: width 0.3s ease;
}
</style>
