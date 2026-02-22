import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { IftarPost } from '../types';
import { MapPin, AlertCircle } from 'lucide-react';

interface MapProps {
  posts: IftarPost[];
  onMarkerClick: (post: IftarPost) => void;
  onMapClick: (lat: number, lng: number) => void;
  center?: { lat: number; lng: number };
}

export const Map: React.FC<MapProps> = ({ posts, onMarkerClick, onMapClick, center }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [MarkerClass, setMarkerClass] = useState<typeof google.maps.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const symbolPathRef = useRef<any>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;

    (setOptions as any)({
      apiKey: apiKey,
      version: 'weekly',
    });

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('core')
    ]).then(([{ Map, InfoWindow }, { Marker }, { SymbolPath }]) => {
      if (mapRef.current && !map) {
        try {
          const initialMap = new Map(mapRef.current, {
            center: center || { lat: 22.9447, lng: 90.8411 },
            zoom: 12,
            styles: [
              {
                "featureType": "all",
                "elementType": "labels.text.fill",
                "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
              },
              {
                "featureType": "administrative.country",
                "elementType": "geometry",
                "stylers": [{ "visibility": "on" }]
              },
              {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{ "color": "#f5f5f5" }, { "lightness": "20" }]
              },
              {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{ "color": "#f5f5f5" }, { "lightness": "21" }]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{ "color": "#ffffff" }, { "lightness": "17" }]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{ "color": "#e9e9e9" }, { "lightness": "17" }]
              }
            ]
          });

          initialMap.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick(e.latLng.lat(), e.latLng.lng());
            }
          });

          infoWindowRef.current = new InfoWindow();
          symbolPathRef.current = SymbolPath;
          setMarkerClass(() => Marker);
          setMap(initialMap);
        } catch (e: any) {
          console.error('Error initializing map:', e);
          setError(e.message);
        }
      }
    }).catch(err => {
      console.error('Error loading Google Maps libraries:', err);
      setError('Failed to load Google Maps. Please check your API key and internet connection.');
    });
  }, [center, onMapClick, map, apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gray-100 flex flex-col items-center justify-center p-4 text-center border-b-4 border-[#fbbf24]">
        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
        <h3 className="text-[#064e3b] font-bold">Google Maps API Key Missing</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Please add your <code>VITE_GOOGLE_MAPS_API_KEY</code> to the environment variables to see the map.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-red-50 flex flex-col items-center justify-center p-4 text-center border-b-4 border-red-200">
        <AlertCircle className="w-12 h-12 text-red-400 mb-2" />
        <h3 className="text-red-800 font-bold">Map Loading Error</h3>
        <p className="text-sm text-red-600 max-w-xs">{error}</p>
        <p className="text-xs text-red-500 mt-2">
          Ensure "Maps JavaScript API" is enabled in your Google Cloud Console.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (!map || !infoWindowRef.current || !MarkerClass) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

      posts.forEach(post => {
        const isVerified = post.true_votes >= 10;
        const isReported = post.false_votes >= 5;
        
        const marker = new MarkerClass({
          position: { lat: post.latitude, lng: post.longitude },
          map: map,
          title: post.location_name,
          icon: {
            path: symbolPathRef.current?.CIRCLE || 0,
            fillColor: isVerified ? '#10b981' : isReported ? '#ef4444' : '#fbbf24',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 10,
          }
        });

        marker.addListener('click', () => {
          const content = `
            <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 240px; background: #fff; border-radius: 12px;">
              <div style="display: flex; justify-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; color: #064e3b; font-size: 18px; font-weight: 700;">${post.location_name}</h3>
              </div>
              
              <div style="margin-bottom: 12px;">
                ${isVerified ? '<span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase;">✓ Verified</span>' : ''}
                ${isReported ? '<span style="background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase;">⚠ Reported</span>' : ''}
              </div>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">By: ${post.owner_email}</p>
              
              <div style="font-size: 13px; color: #374151; margin-bottom: 12px; line-height: 1.5;">
                <strong>Time:</strong> ${post.time}<br>
                <strong>Food:</strong> ${post.food_description}
              </div>
              
              <div style="display: flex; gap: 12px; font-size: 12px; font-weight: 700; margin-bottom: 12px; padding: 8px; background: #f9fafb; border-radius: 8px;">
                <span style="color: #10b981;">👍 ${post.true_votes}</span>
                <span style="color: #ef4444;">👎 ${post.false_votes}</span>
              </div>

              <a href="https://www.google.com/maps/dir/?api=1&destination=${post.latitude},${post.longitude}" 
                 target="_blank" 
                 style="display: block; text-align: center; background: #064e3b; color: #fff; padding: 8px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;">
                 Open in Google Maps
              </a>
            </div>
          `;
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map, marker);
          onMarkerClick(post);
        });

        markersRef.current.push(marker);
      });
  }, [posts, map, onMarkerClick, MarkerClass]);

  return (
    <div className="w-full h-[300px] md:h-[400px] shadow-inner border-b-4 border-[#fbbf24]">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};
