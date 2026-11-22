import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, X, Search, LocateFixed } from 'lucide-react';

const libraries: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat: number;
  initialLng: number;
}

export function MapPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}: MapPickerModalProps) {

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState({ lat: initialLat, lng: initialLng });
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);

  useEffect(() => {
    setMarkerPos({ lat: initialLat, lng: initialLng });
  }, [initialLat, initialLng]);

  const onMapLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setMarkerPos({
        lat: event.latLng.lat(),
        lng: event.latLng?.lng(),
      });
    }
  };

  const onLoadAutocomplete = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMarkerPos({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(17);
      }
    }
  };

  // NUEVA FUNCIÓN: Obtener ubicación GPS del navegador
  const centrarEnMiUbicacion = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPos({ lat, lng });
        map?.panTo({ lat, lng });
        map?.setZoom(17);
        setObteniendoUbicacion(false);
      },
      (error) => {
        console.error("Error de GPS:", error);
        alert("No se pudo obtener tu ubicación. Verifica los permisos de tu navegador.");
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true } // Fuerza a usar el GPS más preciso disponible
    );
  };

  const handleConfirm = () => {
    onSelectLocation(markerPos.lat, markerPos.lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-800">
            <MapPin size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold">Seleccionar Ubicación Exacta</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          <div className="flex gap-2">
            {isLoaded && (
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Search size={18} className="text-slate-400" />
                </div>
                <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                  <input
                    type="text"
                    placeholder="Busca un colegio o calle..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    onKeyDown={(e) => { e.key === 'Enter' && e.preventDefault() }}
                  />
                </Autocomplete>
              </div>
            )}

            {/* NUEVO BOTÓN DE GPS */}
            <button
              type="button"
              onClick={centrarEnMiUbicacion}
              disabled={obteniendoUbicacion}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
              title="Centrar en mi ubicación actual"
            >
              <LocateFixed size={18} className={obteniendoUbicacion ? "animate-pulse text-blue-600" : "text-slate-600"} />
              <span className="hidden sm:inline">{obteniendoUbicacion ? 'Buscando...' : 'Mi Ubicación'}</span>
            </button>
          </div>

          <div className="w-full bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative">
            {loadError && (
              <div className="p-8 text-center text-red-500 font-medium">Error al cargar Google Maps.</div>
            )}

            {!isLoaded && !loadError && (
              <div className="p-8 text-center text-slate-500 font-medium h-[400px] flex items-center justify-center">
                Cargando mapa...
              </div>
            )}

            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markerPos}
                zoom={14}
                onClick={handleMapClick}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                options={{ streetViewControl: false, mapTypeControl: false }}
              >
                <Marker
                  position={markerPos}
                  draggable={true}
                  onDragEnd={handleMapClick}
                  animation={google.maps.Animation.DROP}
                />
              </GoogleMap>
            )}
          </div>

          <div className="text-xs text-slate-500 flex justify-between">
            <span>Mueve el pin o usa el buscador.</span>
            <span className="font-mono bg-slate-100 px-2 rounded">
              Lat: {markerPos.lat.toFixed(6)} | Lng: {markerPos.lng.toFixed(6)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button type="button" onClick={onClose} className="px-5 py-2 hover:bg-slate-100 transition rounded-lg text-sm font-medium border border-slate-300">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition">
            Confirmar Ubicación
          </button>
        </div>

      </div>
    </div>
  );
}