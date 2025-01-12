import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';
import { createContext, useContext, useEffect } from 'react';
import { getMarkerRoutes } from '../components/MarkerRoutes/api';
import type { MarkerRouteItem } from '../components/MarkerRoutes/MarkerRoutes';
import { latestLeafletMap } from '../components/WorldMap/useWorldMap';
import { fetchJSON } from '../utils/api';
import { writeError } from '../utils/logs';
import { notify } from '../utils/notifications';
import { isOverwolfApp } from '../utils/overwolf';
import { usePersistentState } from '../utils/storage';
import { useFilters } from './FiltersContext';
import { useUser } from './UserContext';

export type MarkerBasic = {
  type: string;
  position: [number, number, number];
  name?: string;
  chestType?: string;
  tier?: number;
  level?: number;
  comments?: number;
  _id: string;
  screenshotFilename?: string;
};

type MarkersContextProps = {
  markers: MarkerBasic[];
  setMarkers: (
    value: MarkerBasic[] | ((value: MarkerBasic[]) => MarkerBasic[])
  ) => void;
  setTemporaryHiddenMarkerIDs: (
    value: string[] | ((value: string[]) => string[])
  ) => void;
  markerRoutes: MarkerRouteItem[];
  clearMarkerRoutes: () => void;
  toggleMarkerRoute: (markerRoute: MarkerRouteItem) => void;
  visibleMarkers: MarkerBasic[];
  refresh: () => void;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  allMarkerRoutes: MarkerRouteItem[];
  refreshMarkerRoutes: () => void;
};
const MarkersContext = createContext<MarkersContextProps>({
  markers: [],
  setMarkers: () => undefined,
  setTemporaryHiddenMarkerIDs: () => undefined,
  markerRoutes: [],
  clearMarkerRoutes: () => undefined,
  toggleMarkerRoute: () => undefined,
  visibleMarkers: [],
  refresh: () => undefined,
  mode: null,
  setMode: () => undefined,
  allMarkerRoutes: [],
  refreshMarkerRoutes: () => undefined,
});

type MarkersProviderProps = {
  children: ReactNode;
  readonly?: boolean;
};

type Mode = 'route' | 'marker' | null;

export function MarkersProvider({
  children,
  readonly,
}: MarkersProviderProps): JSX.Element {
  const [markers, setMarkers] = usePersistentState<MarkerBasic[]>(
    'markers',
    []
  );
  const [allMarkerRoutes, setAllMarkerRoutes] = usePersistentState<
    MarkerRouteItem[]
  >('all-marker-routes', []);

  const [markerRoutes, setMarkerRoutes] = usePersistentState<MarkerRouteItem[]>(
    'markers-routes',
    []
  );
  const [mode, setMode] = useState<Mode>(null);
  const [temporaryHiddenMarkerIDs, setTemporaryHiddenMarkerIDs] = useState<
    string[]
  >([]);

  const [filters, setFilters] = useFilters();
  const user = useUser();

  const refresh = () => {
    if (!readonly) {
      if (isOverwolfApp) {
        setMarkers([]);
        setAllMarkerRoutes([]);
        setMarkerRoutes([]);
      } else {
        notify(
          fetchJSON<MarkerBasic[]>('/api/markers').then((newMarkers) => {
            if (JSON.stringify(newMarkers) !== JSON.stringify(markers)) {
              setMarkers(newMarkers);
            }
          })
        );
      }
    }
  };

  const refreshMarkerRoutes = async () => {
    try {
      if (!isOverwolfApp) {
        const newMarkerRoutes = await notify(getMarkerRoutes());
        setAllMarkerRoutes(newMarkerRoutes);
      }
    } catch (error) {
      writeError(error);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const selectedMarkerRoutes: MarkerRouteItem[] = [];
    markerRoutes.forEach((markerRoute) => {
      const newMarkerRoute = allMarkerRoutes.find(
        (targetMarkerRoute) => targetMarkerRoute._id === markerRoute._id
      );
      if (newMarkerRoute) {
        selectedMarkerRoutes.push(newMarkerRoute);
      }
    });
    setMarkerRoutes(selectedMarkerRoutes);
  }, [allMarkerRoutes]);

  const hiddenMarkerIds = user?.hiddenMarkerIds || [];
  const visibleMarkers = useMemo(
    () =>
      markers.filter(
        (marker) =>
          filters.some((filter) => filter === marker.type) &&
          !temporaryHiddenMarkerIDs.includes(marker._id) &&
          (filters.includes('hidden') || !hiddenMarkerIds.includes(marker._id))
      ),

    [filters, markers, hiddenMarkerIds, temporaryHiddenMarkerIDs]
  );

  const toggleMarkerRoute = (markerRoute: MarkerRouteItem) => {
    const markerRoutesClone = [...markerRoutes];
    const index = markerRoutesClone.findIndex(
      (targetMarkerRoute) => targetMarkerRoute._id === markerRoute._id
    );
    if (index > -1) {
      markerRoutesClone.splice(index, 1);
    } else {
      const types = Object.keys(markerRoute.markersByType);
      setFilters((filters) => [
        ...filters,
        ...types.filter((type) => !filters.includes(type)),
      ]);
      markerRoutesClone.push(markerRoute);
      if (latestLeafletMap) {
        latestLeafletMap.fitBounds(markerRoute.positions);
      }
    }

    setMarkerRoutes(markerRoutesClone);
  };

  function clearMarkerRoutes() {
    setMarkerRoutes([]);
  }

  return (
    <MarkersContext.Provider
      value={{
        markers,
        setMarkers,
        setTemporaryHiddenMarkerIDs,
        visibleMarkers,
        refresh,
        markerRoutes,
        clearMarkerRoutes,
        toggleMarkerRoute,
        mode,
        setMode,
        allMarkerRoutes,
        refreshMarkerRoutes,
      }}
    >
      {children}
    </MarkersContext.Provider>
  );
}

export function useMarkers(): MarkersContextProps {
  return useContext(MarkersContext);
}
