require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const express = require('express');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const fileName = 'inquiries.csv';
const filePath = path.join(__dirname, fileName);

const app = express();
const PORT = process.env.PORT || 3000;

// Write CSV header if file doesn't exist
if (!fs.existsSync(filePath)) {
  const header = 'Name,Address,Phone,Item,Submitted At\n';
  fs.writeFileSync(filePath, header, 'utf8');
}

// Listen for Supabase changes and append new rows
async function listenForChanges() {
  supabase
    .channel('inquiries-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inquiries',
      },
      async (payload) => {
        console.log('New entry:', payload.new);

        const row = `${payload.new.name},${payload.new.address},${payload.new.phone},${payload.new.item},${payload.new.created_at}\n`;

        fs.appendFile(filePath, row, (err) => {
          if (err) {
            console.error('Error writing to CSV:', err);
          } else {
            console.log('New row added to CSV.');
          }
        });
      }
    )
    .subscribe();
}

// Endpoint to download the CSV file
app.get('/download-csv', (req, res) => {
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Could not download the file.');
    }
  });
});

// Simple homepage with download link
app.get('/', (req, res) => {
  res.send(`
    <h1>Download Inquiries CSV</h1>
    <a href="/download-csv" download>Download CSV</a>
  `);
});

// Start Express server and Supabase listener
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  listenForChanges();
});
