const fs = require('fs');
const file = 'src/mock/tracks.json';
const tracks = JSON.parse(fs.readFileSync(file, 'utf8'));

const newTrack = {
  "incidentId": "OSP-2024-0046",
  "mmsi": "219018442",
  "vesselName": "DANISH ENTERPRISE",
  "vesselType": "PRODUCT TANKER",
  "trackColor": "#FFB347",
  "points": [
    { "lat": 29.115, "lon": -88.985, "timestamp": "2024-05-24T06:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 29.085, "lon": -88.885, "timestamp": "2024-05-24T08:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 29.066, "lon": -88.822, "timestamp": "2024-05-24T09:15:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 29.040, "lon": -88.735, "timestamp": "2024-05-24T11:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 29.010, "lon": -88.635, "timestamp": "2024-05-24T13:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 28.965, "lon": -88.485, "timestamp": "2024-05-24T16:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 28.920, "lon": -88.335, "timestamp": "2024-05-24T19:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" },
    { "lat": 28.890, "lon": -88.235, "timestamp": "2024-05-24T21:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" }
  ]
};

tracks.unshift(newTrack);
fs.writeFileSync(file, JSON.stringify(tracks, null, 2));
console.log("Track added");
