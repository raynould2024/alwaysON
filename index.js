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
res.setHeader('Content-Type', 'text/html');
  res.send(`
    <html>
      <head>
        <title>Download Inquiries CSV</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f6f8;
            display: flex;
            height: 100vh;
            justify-content: center;
            align-items: center;
            margin: 0;
            color: #333;
          }
          .container {
            background: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 {
            margin-bottom: 1.5rem;
            font-weight: 700;
          }
          a {
            display: inline-block;
            text-decoration: none;
            background-color: #0070f3;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            transition: background-color 0.3s ease;
          }
          a:hover {
            background-color: #005bb5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Download Inquiries CSV</h1>
          <a href="/download-csv" download>Download CSV</a>
        </div>
      </body>
    </html>
  `);
});

// Start Express server and Supabase listener
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  listenForChanges();
});
