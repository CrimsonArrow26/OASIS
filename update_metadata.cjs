const fs = require('fs');

const metadataFile = 'src/mock/sar-metadata.json';
const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));

// Filenames from user's screenshot
const filenames = [
  '2018_08_21_.png',
  '2018_09_14_.png',
  '2018_12_07.png',
  '2018_12_07_b.png',
  '2018_12_19.png',
  '2018_12_19_b.png',
  '2018_12_31_b.png',
  '20190816.png',
  '20190908.png',
  '20200224.png',
  '20200307.png',
  '20200319.png',
  '20200331.png',
  '20200822.png'
];

const incidentIds = Object.keys(metadata);

incidentIds.forEach((id, index) => {
  const filename = filenames[index % filenames.length];
  metadata[id].imageUrl = `/sar_images/SIH26143_website_images/png/${filename}`;
  metadata[id].maskUrl = `/sar_images/SIH26143_website_images/overlay/${filename}`;
});

fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
console.log('Metadata updated with user filenames.');
