import fs from 'fs';
const data = JSON.parse(fs.readFileSync('src/utils/geoparser/postcode_map_full.geojson', 'utf8'));
const communities = new Set();
for (const feature of data.features) {
  if (feature.properties) {
    communities.add(`${feature.properties.community} (district: ${feature.properties.district})`);
  }
}
console.log(Array.from(communities));
