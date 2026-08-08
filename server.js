const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Vercel serverless functions need to store temporary or persistent files 
// in the /tmp directory because the root folder is read-only.
const DB_PATH = path.join('/tmp', 'hwids.txt');

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '');
}

function getAllHwids() {
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (err) {
    return [];
  }
}

function saveHwids(list) {
  try {
    fs.writeFileSync(DB_PATH, list.join('\n') + '\n');
  } catch (err) {
    console.error('Failed to save HWID file:', err);
  }
}

app.post('/api/hwid', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { hwid } = req.body || {};

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
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = app;
