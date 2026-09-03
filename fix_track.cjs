const fs = require('fs');
const file = 'src/mock/tracks.json';
const tracks = JSON.parse(fs.readFileSync(file, 'utf8'));

// Find and update the track we just added to make sure it covers past 21:18Z
const track = tracks.find(t => t.mmsi === "219018442");
if (track) {
  track.points.push({ "lat": 28.860, "lon": -88.135, "timestamp": "2024-05-24T23:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" });
  track.points.push({ "lat": 28.830, "lon": -88.035, "timestamp": "2024-05-25T01:00:00Z", "speed": 12.0, "course": 110, "status": "Under way" });
  fs.writeFileSync(file, JSON.stringify(tracks, null, 2));
  console.log("Track updated");
}
