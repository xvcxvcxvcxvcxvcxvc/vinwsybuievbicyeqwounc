const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'data', 'hwids.txt');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '');
}

function getAllHwids() {
  const content = fs.readFileSync(DB_PATH, 'utf8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function saveHwids(list) {
  fs.writeFileSync(DB_PATH, list.join('\n') + '\n');
}

app.post('/api/hwid', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { hwid } = req.body;

  if (!hwid || typeof hwid !== 'string' || hwid.length < 5 || hwid.length > 256) {
    return res.status(400).json({ success: false, error: 'Invalid HWID length or type' });
  }

  const hwids = getAllHwids();
  const existingIndex = hwids.indexOf(hwid);

  if (existingIndex !== -1) {
    return res.status(200).json({
      success: true,
      uid: existingIndex + 1,
      isNew: false
    });
  }

  hwids.push(hwid);
  saveHwids(hwids);

  return res.status(200).json({
    success: true,
    uid: hwids.length,
    isNew: true
  });
});

module.exports = app;
