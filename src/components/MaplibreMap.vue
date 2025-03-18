<template>
  <div class="map-container" :class="{ 'sidebar-open': selectedProperty }">
    <Sidebar :selectedProperty="selectedProperty" @isClosed="handleSidebarClose" />
    <div ref="mapContainer" class="map">
      <div class="title-controls">
        <div class="title">Open Areas Index</div>
        <sl-icon-button name="layers" label="Layers" @click="toggleLayersMenu"></sl-icon-button>
        <sl-menu v-if="layersMenuOpen" class="layers-menu">
          <div class="layers-menu-header">
            <span>Map Layers</span>
            <sl-icon-button name="x" label="Close" @click="toggleLayersMenu"></sl-icon-button>
          </div>
          <sl-button-group>
            <sl-button :variant="currentStyle === 'default' ? 'primary' : 'default'" @click="setMapStyle('default')">Default</sl-button>
            <sl-button :variant="currentStyle === 'satellite' ? 'primary' : 'default'" @click="setMapStyle('satellite')">Satellite</sl-button>
            <sl-button :variant="currentStyle === 'nearmap2020' ? 'primary' : 'default'" @click="setMapStyle('nearmap2020')">2020 Imagery</sl-button>
          </sl-button-group>
          <sl-menu-item v-for="layer in layers" :key="layer.id">
            <sl-switch :checked="layer.visible" @sl-change="toggleLayerVisibility(layer.id, $event.target.checked)">
              {{ layer.name }}
            </sl-switch>
          </sl-menu-item>
        </sl-menu>
      </div>
    </div>
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
    const { map, selectedProperty, setMapStyle, clearSelectedParcelOutline, setLayerVisibility } = useMap(mapContainer);
    const layersMenuOpen = ref(false);
    const layers = ref([
      { 
        id: 'properties', 
        name: 'Properties', 
        visible: true,
        layers: ['properties-polygons', 'properties-border']
      },
      { 
        id: 'streams-border', 
        name: 'Streams', 
        visible: true,
        layers: ['streams-border']
      },
      { 
        id: 'landuse', 
        name: 'Land Use', 
        visible: true,
        layers: ['landuse-polygons']
      },
      { 
        id: 'borough-border', 
        name: 'Borough Border', 
        visible: true,
        layers: ['borough-border-outer', 'borough-border-inner']
      },
    ]);
    const currentStyle = ref('default');

    const toggleLayersMenu = () => {
      layersMenuOpen.value = !layersMenuOpen.value;
    };

    const toggleLayerVisibility = (layerId, visible) => {
      const layer = layers.value.find(l => l.id === layerId);
      if (layer) {
        layer.visible = visible;
        if (layer.layers) {
          // Handle grouped layers
          layer.layers.forEach(id => setLayerVisibility(id, visible));
        } else {
          setLayerVisibility(layerId, visible);
        }
      }
    };

    const handleSidebarClose = () => {
      selectedProperty.value = null;
      clearSelectedParcelOutline();
      map.value.fitBounds([[-75.167558, 40.286788], [-75.084817, 40.343006]]); // Replace with your original extent coordinates
    };

    const setMapStyleWithUpdate = (style) => {
      currentStyle.value = style;
      setMapStyle(style);
    };

    return { mapContainer, selectedProperty, layersMenuOpen, layers, toggleLayersMenu, toggleLayerVisibility, handleSidebarClose, setMapStyle: setMapStyleWithUpdate, currentStyle };
  },
};
</script>

<style>
.map-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
}

.map-container.sidebar-open .map {
  width: calc(100% - 300px);
}

.map {
  flex-grow: 1;
  transition: width 0.3s ease;
}

.title-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9;
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

sl-icon-button::part(base) {
  color: #333;
}

.layers-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 1em;
  background: white;
  color: black;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  min-width: 200px;
}

.layers-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  font-weight: 500;
}

.layers-menu > sl-button-group,
.layers-menu > sl-menu-item {
  padding: 0 10px;
}

.layers-menu > :last-child {
  margin-bottom: 10px;
}
</style>
