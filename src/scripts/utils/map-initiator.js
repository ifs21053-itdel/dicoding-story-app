import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Perbaiki marker icon yang hilang
const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

class MapInitiator {
  constructor({ mapElement, latitudeInput, longitudeInput }) {
    this._mapElement = mapElement;
    this._latitudeInput = latitudeInput;
    this._longitudeInput = longitudeInput;
    this._locationText = document.getElementById('locationText'); // Tambahkan referensi ke text
    
    this._map = null;
    this._marker = null;
  }

 // Tambahkan pada MapInitiator class di map-initiator.js

async init() {
  return new Promise((resolve) => {
    this._map = L.map(this._mapElement, {
      zoomControl: true,
      attributionControl: true
    }).setView([-1.8, 118], 5);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this._map);

    // Add click event to map for selecting location
    this._map.on('click', (e) => {
      this._addMarker(e.latlng.lat, e.latlng.lng);
    });

    // Try to get current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this._map.setView([latitude, longitude], 13);
        this._addMarker(latitude, longitude);
        resolve();
      },
      () => {
        // Default view if geolocation fails
        resolve();
      }
    );
    
    // Trigger resize event after map is created to fix rendering issues
    // Modifikasi: Menambahkan defer dan interval untuk memastikan peta dirender dengan benar
    setTimeout(() => {
      this._map.invalidateSize();
    }, 100);
    
    // Tambahkan interval untuk memastikan peta tetap terender dengan benar
    // ketika tampilan berubah (seperti drawer dibuka/ditutup)
    const mapResizeInterval = setInterval(() => {
      if (this._map) {
        this._map.invalidateSize();
      } else {
        clearInterval(mapResizeInterval);
      }
    }, 1000);
  });
}

  _addMarker(lat, lng) {
    // Remove existing marker
    if (this._marker) {
      this._map.removeLayer(this._marker);
    }

    // Add new marker with custom icon
    this._marker = L.marker([lat, lng], { icon: icon }).addTo(this._map);
    this._marker.bindPopup('Selected Location').openPopup();

    // Update input fields
    if (this._latitudeInput && this._longitudeInput) {
      this._latitudeInput.value = lat;
      this._longitudeInput.value = lng;
      
      // Update text display - critical fix
      if (this._locationText) {
        this._locationText.textContent = `Selected location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
      
      // Trigger change event to ensure other listeners are notified
      const changeEvent = new Event('change');
      this._latitudeInput.dispatchEvent(changeEvent);
      this._longitudeInput.dispatchEvent(changeEvent);
      
      // Enable post button if needed
      const submitButton = document.getElementById('submitButton');
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  addMarker(lat, lng, popupContent = 'Story Location') {
    if (!this._map) return;
    
    const marker = L.marker([lat, lng], { icon: icon }).addTo(this._map);
    marker.bindPopup(popupContent).openPopup();
    
    return marker;
  }

  createMap(locations) {
    if (!this._map) return;
    
    // Add markers for all locations
    const bounds = [];
    
    locations.forEach((location) => {
      const { lat, lng, name, description, photoUrl } = location;
      
      const marker = this.addMarker(lat, lng, 
        `<div>
          <strong>${name}</strong>
          <p>${description.substring(0, 50)}...</p>
          <img src="${photoUrl}" alt="${name}" style="width: 100%; max-width: 150px;">
        </div>`
      );
      
      bounds.push([lat, lng]);
    });
    
    // Fit map to show all markers
    if (bounds.length > 0) {
      this._map.fitBounds(bounds);
    }
  }
}

export default MapInitiator;