const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists on startup
async function initUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log('Uploads directory initialized.');
  } catch (err) {
    console.error('Error initializing uploads directory:', err);
  }
}
initUploadsDir();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS & Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self';");
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const id = crypto.randomUUID();
    req.fileId = id;
    cb(null, `${id}-file`);
  }
});
const upload = multer({ storage: storage });

// Filename Sanitization Helper
function sanitizeFilename(name) {
  if (!name) return 'unnamed';
  return name.replace(/[/\\]/g, '_').replace(/[<>:"|?*]/g, '');
}

// 1. POST /upload - File sharing
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const id = req.fileId || crypto.randomUUID();
  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

  // Cleanup partial file if request is aborted prematurely
  req.on('aborted', async () => {
    console.warn(`Upload aborted by client for file ${id}`);
    try {
      await fs.unlink(path.join(UPLOADS_DIR, `${id}-file`));
    } catch (e) {}
  });

  const metadata = {
    id,
    originalName,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadTime: Date.now(),
    expiryTime,
    type: 'file'
  };

  try {
    await fs.writeFile(path.join(UPLOADS_DIR, `${id}-meta.json`), JSON.stringify(metadata, null, 2), 'utf8');
    res.status(200).json({
      id,
      fileName: originalName,
      downloadUrl: `/download/${id}`,
      expiryTime
    });
  } catch (err) {
    console.error('Error saving file metadata:', err);
    res.status(500).json({ error: 'Failed to save metadata' });
  }
});

// 1b. POST /share-target - Web Share Target server handling
app.post('/share-target', upload.single('file'), async (req, res) => {
  try {
    const { title, text, url: sharedUrl } = req.body;
    const query = new URLSearchParams({ shared: '1' });

    if (req.file) {
      const id = req.fileId || crypto.randomUUID();
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
      const metadata = {
        id,
        originalName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadTime: Date.now(),
        expiryTime,
        type: 'file'
      };
      await fs.writeFile(path.join(UPLOADS_DIR, `${id}-meta.json`), JSON.stringify(metadata, null, 2), 'utf8');
      query.set('id', id);
      query.set('type', 'file');
    } else {
      const combinedText = [text, sharedUrl, title].filter(Boolean).join(' ');
      if (combinedText.trim()) {
        const id = crypto.randomUUID();
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
        const metadata = {
          id,
          originalName: `${id}-snippet.txt`,
          mimeType: 'text/plain',
          size: Buffer.byteLength(combinedText),
          uploadTime: Date.now(),
          expiryTime,
          type: 'text'
        };
        await fs.writeFile(path.join(UPLOADS_DIR, `${id}-snippet.txt`), combinedText, 'utf8');
        await fs.writeFile(path.join(UPLOADS_DIR, `${id}-meta.json`), JSON.stringify(metadata, null, 2), 'utf8');
        query.set('id', id);
        query.set('type', 'text');
      }
    }
    res.redirect(303, `./?${query.toString()}`);
  } catch (err) {
    console.error('Error processing /share-target server fallback:', err);
    res.redirect(303, './');
  }
});

// 2. POST /text & POST /share-text - Text sharing
app.post(['/text', '/share-text'], async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Empty text snippet not allowed' });
  }

  const id = crypto.randomUUID();
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

  const metadata = {
    id,
    originalName: `${id}-snippet.txt`,
    mimeType: 'text/plain',
    size: Buffer.byteLength(text),
    uploadTime: Date.now(),
    expiryTime,
    type: 'text'
  };

  try {
    await fs.writeFile(path.join(UPLOADS_DIR, `${id}-snippet.txt`), text, 'utf8');
    await fs.writeFile(path.join(UPLOADS_DIR, `${id}-meta.json`), JSON.stringify(metadata, null, 2), 'utf8');
    res.status(200).json({
      id,
      snippetUrl: `/snippet/${id}`,
      expiryTime
    });
  } catch (err) {
    console.error('Error saving text snippet:', err);
    res.status(500).json({ error: 'Failed to share text snippet' });
  }
});

// 3. GET /download/:id - File download (forces attachment download)
app.get('/download/:id', async (req, res) => {
  const id = req.params.id;
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const metaPath = path.join(UPLOADS_DIR, `${id}-meta.json`);
  const filePath = path.join(UPLOADS_DIR, `${id}-file`);

  try {
    await fs.access(metaPath);
    await fs.access(filePath);

    const metaRaw = await fs.readFile(metaPath, 'utf8');
    const metadata = JSON.parse(metaRaw);

    const safeName = sanitizeFilename(metadata.originalName);

    // Apply strict sandbox download headers to avoid browser execution
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');

    res.download(filePath, safeName, (err) => {
      if (err && !res.headersSent) {
        console.error('Download stream error:', err);
        res.status(500).end();
      }
    });
  } catch (err) {
    res.status(404).json({ error: 'File not found or expired' });
  }
});

// 4. GET /snippet/:id - Text snippet display
app.get('/snippet/:id', async (req, res) => {
  const id = req.params.id;
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const metaPath = path.join(UPLOADS_DIR, `${id}-meta.json`);
  const snippetPath = path.join(UPLOADS_DIR, `${id}-snippet.txt`);

  try {
    await fs.access(metaPath);
    await fs.access(snippetPath);

    const textContent = await fs.readFile(snippetPath, 'utf8');
    
    // Sandbox header to prevent XSS if snippet contains HTML
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(textContent);
  } catch (err) {
    res.status(404).json({ error: 'Snippet not found or expired' });
  }
});

// 5. GET /items - Retrieve list of active shared items (files and snippets)
app.get('/items', async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const metaFiles = files.filter(file => file.endsWith('-meta.json'));
    const items = [];

    for (const file of metaFiles) {
      const metaPath = path.join(UPLOADS_DIR, file);
      try {
        const dataRaw = await fs.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(dataRaw);

        // Check if item is not expired
        if (metadata.expiryTime && metadata.expiryTime > Date.now()) {
          // If type is text, populate the content property
          if (metadata.type === 'text') {
            const snippetPath = path.join(UPLOADS_DIR, `${metadata.id}-snippet.txt`);
            try {
              metadata.content = await fs.readFile(snippetPath, 'utf8');
            } catch (snippetErr) {
              console.error(`Error reading snippet file for ${metadata.id}:`, snippetErr);
              metadata.content = '';
            }
          }
          items.push(metadata);
        }
      } catch (err) {
        console.error(`Error reading or parsing metadata file ${file}:`, err);
      }
    }

    // Sort descending by uploadTime
    items.sort((a, b) => b.uploadTime - a.uploadTime);

    // Limit to top 10 active items
    const top10 = items.slice(0, 10);

    res.status(200).json(top10);
  } catch (err) {
    console.error('Error scanning uploads for items:', err);
    res.status(500).json({ error: 'Failed to retrieve active shared items' });
  }
});

// Expiration routine: Delete files modified > 24 hours ago
async function cleanupExpiredFiles() {
  console.log('Running background cleanup routine...');
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const now = Date.now();
    const expiryAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;
        if (age > expiryAge) {
          console.log(`Deleting expired file: ${file} (age: ${(age / 3600000).toFixed(2)}h)`);
          await fs.unlink(filePath);
        }
      } catch (err) {
        console.error(`Failed to process or delete ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error scanning directory for expired files:', err);
  }
}

// Background cleanup task runs hourly (3600000 ms)
const CLEANUP_INTERVAL = 60 * 60 * 1000;
setInterval(cleanupExpiredFiles, CLEANUP_INTERVAL);

function configureServerTimeouts(server) {
  server.timeout = 30 * 60 * 1000; // 30 minutes
  server.keepAliveTimeout = 60 * 1000; // 60 seconds
  server.headersTimeout = 65 * 1000; // 65 seconds
  if (server.requestTimeout !== undefined) {
    server.requestTimeout = 30 * 60 * 1000; // 30 minutes
  }
  return server;
}

module.exports = { app, cleanupExpiredFiles, UPLOADS_DIR, configureServerTimeouts };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  configureServerTimeouts(server);
}
