const fs = require('fs');

const vesselsFile = 'src/mock/vessels.json';
const tracksFile = 'src/mock/tracks.json';
const incidentsFile = 'src/mock/incidents.json';

const vessels = JSON.parse(fs.readFileSync(vesselsFile, 'utf8'));
const tracks = JSON.parse(fs.readFileSync(tracksFile, 'utf8'));
const incidents = JSON.parse(fs.readFileSync(incidentsFile, 'utf8'));

const existingMmsis = new Set(tracks.map(t => t.mmsi));

const incidentMap = {};
for (const inc of incidents) {
  incidentMap[inc.id] = inc;
}

let addedCount = 0;

for (const vessel of vessels) {
  if (!existingMmsis.has(vessel.mmsi)) {
    const inc = incidentMap[vessel.incidentId];
    if (!inc) continue;
    
    const lat = inc.lat;
    const lon = inc.lon;
    const course = vessel.courseDeg || Math.floor(Math.random() * 360);
    const speed = vessel.speedKts || 12.0;
    
    // Generate some points around the incident time
    // We'll generate points from incident time - 24 hours to incident time + 12 hours
    const detectedAt = new Date(inc.detectedAt).getTime();
    
    const points = [];
    
    for (let h = -24; h <= 12; h += 2) {
      const pointTime = new Date(detectedAt + h * 3600 * 1000);
      
      // Basic projection based on time difference and course/speed
      // 1 knot = 1.852 km/h
      // 1 degree lat = 111 km
      // 1 degree lon = 111 * cos(lat) km
      
      // Calculate distance traveled in hours
      const distKm = speed * 1.852 * h;
      
      const radCourse = course * Math.PI / 180;
      const dLat = (distKm * Math.cos(radCourse)) / 111;
      const dLon = (distKm * Math.sin(radCourse)) / (111 * Math.cos(lat * Math.PI / 180));
      
      points.push({
        lat: lat + dLat,
        lon: lon + dLon,
        timestamp: pointTime.toISOString(),
        speed: speed,
        course: course,
        status: "Under way"
      });
    }
    
    tracks.push({
      incidentId: vessel.incidentId,
      mmsi: vessel.mmsi,
      vesselName: vessel.vesselName,
      vesselType: vessel.vesselType || "UNKNOWN",
      trackColor: vessel.rank === 1 ? "#FF3B3B" : (vessel.rank === 2 ? "#FFB347" : "#4A7FA5"),
      points: points
    });
    
    addedCount++;
  }
}

fs.writeFileSync(tracksFile, JSON.stringify(tracks, null, 2));
console.log(`Added ${addedCount} missing tracks.`);
