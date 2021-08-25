import { useEffect, useRef } from 'react';
import leaflet from 'leaflet';
import { mapFilters } from '../MapFilter/mapFilters';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { Marker } from '../../contexts/MarkersContext';

export const LeafIcon: new ({ iconUrl }: { iconUrl: string }) => leaflet.Icon =
  leaflet.Icon.extend({
    options: {
      iconSize: [64, 64],
      tooltipAnchor: [0, -32],
    },
  });

function useLayerGroups({
  leafletMap,
  markers,
  filters,
  onMarkerClick,
}: {
  leafletMap: leaflet.Map | null;
  markers: Marker[];
  filters: string[];
  onMarkerClick?: (marker: Marker) => void;
}): void {
  const layerGroupByFilterRef = useRef<{
    [filterType: string]: leaflet.LayerGroup;
  }>({});

  useEffect(() => {
    if (!leafletMap || !leafletMap.getPane('markerPane') || !markers.length) {
      return;
    }

    Object.entries(layerGroupByFilterRef.current).forEach(
      ([filterType, layerGroup]) => {
        if (!filters.includes(filterType)) {
          leafletMap.removeLayer(layerGroup);
          delete layerGroupByFilterRef.current[filterType];
        }
      }
    );

    filters.forEach((filter) => {
      const mapFilter = mapFilters.find(
        (mapFilter) => mapFilter.type === filter
      );
      if (!mapFilter) {
        console.warn(`No markers for filter ${filter}`);
        return;
      }
      const markersOfType = markers.filter(
        (marker) => marker.type === mapFilter.type
      );
      const icon = new LeafIcon({ iconUrl: mapFilter.iconUrl });

      const existingLayerGroup = layerGroupByFilterRef.current[mapFilter.type];
      if (existingLayerGroup) {
        if (existingLayerGroup.getLayers().length === markersOfType.length) {
          return;
        }
        leafletMap.removeLayer(existingLayerGroup);
      }
      const layerGroup = leaflet.markerClusterGroup({
        iconCreateFunction: () => icon,
        disableClusteringAtZoom: 5,
      });

      layerGroup
        .on('clustermouseover', (event) => {
          event.propagatedFrom
            .bindTooltip(
              `${event.propagatedFrom.getChildCount()} ${mapFilter.title}`,
              {
                direction: 'top',
                sticky: true,
              }
            )
            .openTooltip();
        })
        .on('clustermouseout', (event) => {
          event.propagatedFrom.unbindTooltip();
        });

      markersOfType.forEach((markerOfType) => {
        const marker = leaflet
          .marker([markerOfType.position[1], markerOfType.position[0]], {
            icon,
            pmIgnore: true,
          })
          .bindTooltip(
            markerOfType.name
              ? `${markerOfType.name} (${mapFilter.title})`
              : mapFilter.title,
            {
              direction: 'top',
            }
          );
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(markerOfType);
          });
        }
        layerGroup.addLayer(marker);
      });

      layerGroup.addTo(leafletMap);
      layerGroupByFilterRef.current[mapFilter.type] = layerGroup;
    });
  }, [filters, typeof leafletMap, markers]);
}

export default useLayerGroups;
