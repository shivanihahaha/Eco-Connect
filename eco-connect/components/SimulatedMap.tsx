
import React, { useEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { WasteListing, Location, WasteType } from '../types';
import { TruckIcon, MapPinIcon } from './icons/Icons';
import { WASTE_TYPE_DETAILS } from '../constants';


interface InteractiveMapProps {
    listings?: WasteListing[];
    selectedId?: string;
    collectorLocation?: Location | null;
    destinationLocation?: Location | null;
}

// Component to dynamically set map bounds to fit markers
const MapBoundsUpdater: React.FC<{ bounds: L.LatLngBounds }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
};

// Custom React components for marker icons
const TruckMarkerIcon = () => (
    <div className="p-1 bg-slate-900 rounded-full shadow-lg">
        <TruckIcon className="h-6 w-6 text-white" />
    </div>
);

const DestinationMarkerIcon = () => (
    <MapPinIcon className="h-10 w-10 text-primary drop-shadow-lg" />
);

const WasteMarkerIcon: React.FC<{type: WasteType, isSelected: boolean}> = ({ type, isSelected }) => {
    const { icon: Icon, color } = WASTE_TYPE_DETAILS[type];
    const size = isSelected ? 'w-10 h-10' : 'w-8 h-8';
    const ring = isSelected ? 'ring-4 ring-white/80' : '';
    return (
        <div className={`flex items-center justify-center rounded-full shadow-xl transition-all duration-300 ${color} ${size} ${ring}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
    );
};

// Main Map Component
const InteractiveMap: React.FC<InteractiveMapProps> = ({ listings, selectedId, collectorLocation, destinationLocation }) => {
    const defaultCenter: L.LatLngExpression = [17.4385, 78.4421]; // Hyderabad

    const createDivIcon = (component: React.ReactElement, options: L.DivIconOptions = {}) => {
        return new L.DivIcon({
            html: ReactDOMServer.renderToString(component),
            className: 'bg-transparent border-0', // important to override default leaflet styles
            ...options
        });
    };
    
    const truckIcon = createDivIcon(<TruckMarkerIcon />, { iconSize: [28, 28], iconAnchor: [14, 14] });
    const destinationIcon = createDivIcon(<DestinationMarkerIcon />, { iconSize: [40, 40], iconAnchor: [20, 40] });

    const isTrackingMode = !!destinationLocation;
    const points: L.LatLngExpression[] = [];

    if (isTrackingMode) {
        if (collectorLocation) points.push([collectorLocation.lat, collectorLocation.lng]);
        if (destinationLocation) points.push([destinationLocation.lat, destinationLocation.lng]);
    } else {
        if (collectorLocation) points.push([collectorLocation.lat, collectorLocation.lng]);
        listings?.forEach(l => points.push([l.location.lat, l.location.lng]));
    }
    
    const bounds = points.length > 0 ? L.latLngBounds(points) : L.latLngBounds([defaultCenter, defaultCenter]);
    
    return (
        <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom={true} className="w-full h-full z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.length > 0 && <MapBoundsUpdater bounds={bounds} />}

            {isTrackingMode && collectorLocation && destinationLocation && (
                <>
                    <Marker position={[collectorLocation.lat, collectorLocation.lng]} icon={truckIcon}>
                        <Popup>Live Location</Popup>
                    </Marker>
                    <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={destinationIcon}>
                        <Popup>Destination</Popup>
                    </Marker>
                    <Polyline positions={[[collectorLocation.lat, collectorLocation.lng], [destinationLocation.lat, destinationLocation.lng]]} color="#4f46e5" weight={4} dashArray="8, 12" />
                </>
            )}

            {!isTrackingMode && (
                <>
                    {listings?.map(listing => {
                         const isSelected = listing.id === selectedId;
                         const wasteIcon = createDivIcon(<WasteMarkerIcon type={listing.wasteType} isSelected={isSelected} />, {iconSize: isSelected ? [40, 40] : [32, 32], iconAnchor: isSelected ? [20, 20] : [16,16]});
                         return (
                            <Marker key={listing.id} position={[listing.location.lat, listing.location.lng]} icon={wasteIcon} zIndexOffset={isSelected ? 1000 : 0}>
                                <Popup>
                                    <b>{listing.quantity} of {listing.wasteType}</b><br/>
                                    From: {listing.producer.name}<br/>
                                    <span className="text-slate-500">{listing.location.address}</span>
                                </Popup>
                            </Marker>
                         );
                    })}
                    {collectorLocation && (
                         <Marker position={[collectorLocation.lat, collectorLocation.lng]} icon={truckIcon} zIndexOffset={2000}>
                            <Popup>Your Location</Popup>
                        </Marker>
                    )}
                </>
            )}
        </MapContainer>
    );
};

export default InteractiveMap;