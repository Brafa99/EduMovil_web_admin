import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregir icono por defecto de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

// Componente para centrar el mapa dinámicamente
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// Componente para capturar clics manuales en el mapa
function LocationMarker({ position, setPosition }: { position: L.LatLng | null; setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export const MapPickerModal: React.FC<MapPickerProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = -16.5000,
  initialLng = -68.1500,
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [loadingGps, setLoadingGps] = useState(false);

  // EFECTO: Se ejecuta automáticamente apenas se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Si ya existían coordenadas previas, las usa de entrada
      if (initialLat && initialLng && initialLat !== -16.5000) {
        const prevLatLng = new L.LatLng(initialLat, initialLng);
        setPosition(prevLatLng);
        setMapCenter([initialLat, initialLng]);
      } else {
        // Si no hay coordenadas previas, pide permisos de GPS automáticamente al instante
        if (navigator.geolocation) {
          setLoadingGps(true);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const currentLatLng = new L.LatLng(lat, lng);
              setPosition(currentLatLng);
              setMapCenter([lat, lng]);
              setLoadingGps(false);
            },
            (error) => {
              console.error(error);
              // Si el usuario deniega el permiso, usa La Paz por defecto
              setLoadingGps(false);
              setPosition(new L.LatLng(-16.5000, -68.1500));
            },
            { enableHighAccuracy: true }
          );
        }
      }
    }
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (position) {
      onSelectLocation(position.lat, position.lng);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 shadow-2xl relative">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-base font-bold text-gray-800">
            Selecciona la ubicación en el mapa
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
            &times;
          </button>
        </div>

        {/* Mensaje de estado del GPS */}
        <div className="my-2 text-xs text-gray-500 flex justify-between items-center">
          <span>{loadingGps ? ' Solicitando permisos y obteniendo ubicación actual...' : 'Haz clic en cualquier punto del mapa para ajustar la ubicación.'}</span>
        </div>

        {/* Mapa interactivo */}
        <div className="h-80 w-full my-2 rounded-lg overflow-hidden border">
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        {/* Pie del Modal */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-gray-600">
            {position ? (
              <span>
                <strong>Lat:</strong> {position.lat.toFixed(6)} | <strong>Lng:</strong> {position.lng.toFixed(6)}
              </span>
            ) : (
              <span className="text-amber-600">Cargando ubicación...</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!position || loadingGps}
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};