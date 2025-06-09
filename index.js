// require('dotenv').config();
// const { createClient } = require('@supabase/supabase-js');
// const fs = require('fs');
// const path = require('path');
// const express = require('express');

// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// const fileName = 'inquiries.csv';
// const filePath = path.join(__dirname, fileName);

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Write CSV header if file doesn't exist
// if (!fs.existsSync(filePath)) {
//   const header = 'Name,Address,Phone,Item,Submitted At\n';
//   fs.writeFileSync(filePath, header, 'utf8');
// }

// // Listen for Supabase changes and append new rows
// async function listenForChanges() {
//   supabase
//     .channel('inquiries-channel')
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'inquiries',
//       },
//       async (payload) => {
//         console.log('New entry:', payload.new);

//         const row = `${payload.new.name},${payload.new.address},${payload.new.phone},${payload.new.item},${payload.new.created_at}\n`;

//         fs.appendFile(filePath, row, (err) => {
//           if (err) {
//             console.error('Error writing to CSV:', err);
//           } else {
//             console.log('New row added to CSV.');
//           }
//         });
//       }
//     )
//     .subscribe();
// }

// // Endpoint to download the CSV file
// app.get('/download-csv', (req, res) => {
//   res.download(filePath, fileName, (err) => {
//     if (err) {
//       console.error('Error sending file:', err);
//       res.status(500).send('Could not download the file.');
//     }
//   });
// });

// // Simple homepage with download link
// app.get('/', (req, res) => {
// res.setHeader('Content-Type', 'text/html');
//   res.send(`
//     <html>
//       <head>
//         <title>Download Inquiries CSV</title>
//         <style>
//           body {
//             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//             background: #f4f6f8;
//             display: flex;
//             height: 100vh;
//             justify-content: center;
//             align-items: center;
//             margin: 0;
//             color: #333;
//           }
//           .container {
//             background: white;
//             padding: 2rem 3rem;
//             border-radius: 12px;
//             box-shadow: 0 10px 20px rgba(0,0,0,0.1);
//             text-align: center;
//             max-width: 400px;
//           }
//           h1 {
//             margin-bottom: 1.5rem;
//             font-weight: 700;
//           }
//           a {
//             display: inline-block;
//             text-decoration: none;
//             background-color: #0070f3;
//             color: white;
//             padding: 12px 24px;
//             border-radius: 6px;
//             font-weight: 600;
//             transition: background-color 0.3s ease;
//           }
//           a:hover {
//             background-color: #005bb5;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <h1>Download Inquiries CSV</h1>
//           <a href="/download-csv" download>Download CSV</a>
//         </div>
//       </body>
//     </html>
//   `);
// });

// // Start Express server and Supabase listener
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
//   listenForChanges();
// });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const fileName = 'inquiries.csv';
const filePath = path.join(__dirname, fileName);

const app = express();
const PORT = process.env.PORT || 3000;

// Simple hardcoded credentials
const USERNAME = 'admin';
const PASSWORD = 'secret';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple in-memory session storage (for demo only)
const sessions = new Set();

// Middleware to check auth on protected routes
function checkAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    next();
  } else {
    res.redirect('/login');
  }
}

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

// Login page (GET)
app.get('/login', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Login</title>
        <style>
          body {
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f4f6f8;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
          }
          form {
            background: white;
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            width: 320px;
            box-sizing: border-box;
          }
          h2 {
            margin-bottom: 1.5rem;
            font-weight: 700;
            text-align: center;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }
          input[type="text"],
          input[type="password"] {
            width: 100%;
            padding: 10px 12px;
            margin-bottom: 1.2rem;
            border: 1.5px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
          }
          input[type="text"]:focus,
          input[type="password"]:focus {
            border-color: #0070f3;
            outline: none;
          }
          button {
            width: 100%;
            padding: 12px 0;
            background-color: #0070f3;
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }
          button:hover {
            background-color: #005bb5;
          }
          p.error {
            color: #d9534f;
            margin-top: -1rem;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <form method="POST" action="/login">
          <h2>Login</h2>
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required autocomplete="off" />
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required autocomplete="off" />
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
});

// Login form handler (POST)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    // Create a simple session ID and store it
    const sessionId = Date.now().toString();
    sessions.add(sessionId);
    // Set cookie valid for 1 hour
    res.cookie('sessionId', sessionId, { maxAge: 3600000, httpOnly: true });
    res.redirect('/');
  } else {
    res.send(`
      <p>Invalid credentials. <a href="/login">Try again</a></p>
    `);
  }
});

// Logout endpoint
app.get('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('sessionId');
  res.redirect('/login');
});

// Protect home page and download route with checkAuth middleware
app.get('/', checkAuth, (req, res) => {
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
          .logout {
            margin-top: 1rem;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Download Inquiries CSV</h1>
          <a href="/download-csv" download>Download CSV</a>
          <div class="logout">
            <a href="/logout">Logout</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Endpoint to download the CSV file (protected)
app.get('/download-csv', checkAuth, (req, res) => {
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Could not download the file.');
    }
  });
});

// Start Express server and Supabase listener
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  listenForChanges();
});
