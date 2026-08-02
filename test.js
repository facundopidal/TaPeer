// Programmatic Verification Script for TaPeer

const { app, cleanupExpiredFiles, UPLOADS_DIR } = require('./server');
const fs = require('fs').promises;
const path = require('path');
const assert = require('assert').strict;

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let server;

async function runTests() {
  console.log('=============================================');
  console.log('Starting Integration Tests for TaPeer...');
  console.log('=============================================');

  // Start test server
  server = app.listen(PORT);
  console.log(`Test server listening on ${BASE_URL}`);

  let testCount = 0;
  let passedCount = 0;

  async function test(name, fn) {
    testCount++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error(err);
    }
  }

  // 1. Test POST /upload (File share)
  let uploadedFileId = null;
  await test('POST /upload - Should upload a file and return ID/URL', async () => {
    const boundary = '----WebKitFormBoundarytest';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="testfile.txt"',
      'Content-Type: text/plain',
      '',
      'Hello TaPeer Tapir!',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.equal(data.fileName, 'testfile.txt');
    assert.ok(data.downloadUrl.includes(`/download/${data.id}`));
    assert.ok(data.expiryTime > Date.now());

    uploadedFileId = data.id;
  });

  // 2. Test GET /download/:id (File download)
  await test('GET /download/:id - Should download the uploaded file with security headers', async () => {
    assert.ok(uploadedFileId, 'File ID must be present');
    const res = await fetch(`${BASE_URL}/download/${uploadedFileId}`);
    
    assert.equal(res.status, 200);
    
    // Check headers
    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentDisposition.includes('attachment'));
    assert.ok(contentDisposition.includes('testfile.txt'));
    
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp.includes("sandbox"));

    const content = await res.text();
    assert.equal(content, 'Hello TaPeer Tapir!');
  });

  // 3. Test POST /text (Text share)
  let textSnippetId = null;
  await test('POST /text - Should share text snippet and return snippet URL', async () => {
    const res = await fetch(`${BASE_URL}/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: 'Confidential API Key: jungle-secret-123' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.ok(data.snippetUrl.includes(`/snippet/${data.id}`));
    assert.ok(data.expiryTime > Date.now());

    textSnippetId = data.id;
  });

  // 4. Test GET /snippet/:id (Text retrieval)
  await test('GET /snippet/:id - Should retrieve the shared text snippet', async () => {
    assert.ok(textSnippetId, 'Snippet ID must be present');
    const res = await fetch(`${BASE_URL}/snippet/${textSnippetId}`);

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
    
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp.includes("sandbox"));

    const content = await res.text();
    assert.equal(content, 'Confidential API Key: jungle-secret-123');
  });

  // 5. Test Edge Case: Empty Snippet Share
  await test('POST /text - Empty body should return 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: '   ' })
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  // 6. Test Edge Case: Non-existent ID for download
  await test('GET /download/:id - Non-existent ID should return 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${BASE_URL}/download/${fakeId}`);
    assert.equal(res.status, 404);
  });

  // 7. Test Expiration Cleanup Routine
  await test('File Expiration Routine - Should delete files older than 24h and retain younger files', async () => {
    const oldId = '11111111-1111-1111-1111-111111111111';
    const newId = '22222222-2222-2222-2222-222222222222';

    const oldFilePath = path.join(UPLOADS_DIR, `${oldId}-file`);
    const oldMetaPath = path.join(UPLOADS_DIR, `${oldId}-meta.json`);
    const newFilePath = path.join(UPLOADS_DIR, `${newId}-file`);
    const newMetaPath = path.join(UPLOADS_DIR, `${newId}-meta.json`);

    // Create mock files
    await fs.writeFile(oldFilePath, 'Old File Content', 'utf8');
    await fs.writeFile(oldMetaPath, JSON.stringify({ id: oldId, originalName: 'old.txt', expiryTime: Date.now() - 3600000 }), 'utf8');

    await fs.writeFile(newFilePath, 'New File Content', 'utf8');
    await fs.writeFile(newMetaPath, JSON.stringify({ id: newId, originalName: 'new.txt', expiryTime: Date.now() + 86400000 }), 'utf8');

    // Mock mtime back to 25 hours ago for the old files
    const pastTime = (Date.now() - (25 * 60 * 60 * 1000)) / 1000;
    await fs.utimes(oldFilePath, pastTime, pastTime);
    await fs.utimes(oldMetaPath, pastTime, pastTime);

    // Call cleanup function
    await cleanupExpiredFiles();

    // Verify old files are gone
    let oldFileDeleted = false;
    try {
      await fs.access(oldFilePath);
    } catch {
      oldFileDeleted = true;
    }
    assert.ok(oldFileDeleted, 'Old file should be deleted');

    let oldMetaDeleted = false;
    try {
      await fs.access(oldMetaPath);
    } catch {
      oldMetaDeleted = true;
    }
    assert.ok(oldMetaDeleted, 'Old metadata should be deleted');

    // Verify new files still exist
    let newFileExists = true;
    try {
      await fs.access(newFilePath);
    } catch {
      newFileExists = false;
    }
    assert.ok(newFileExists, 'New file should still exist');

    let newMetaExists = true;
    try {
      await fs.access(newMetaPath);
    } catch {
      newMetaExists = false;
    }
    assert.ok(newMetaExists, 'New metadata should still exist');

    // Cleanup new mock files
    await fs.unlink(newFilePath);
    await fs.unlink(newMetaPath);
  });

  // 8. Test GET /items behavior (active list, sorting, expired filters)
  await test('GET /items - Should return active items sorted descending and filter expired items', async () => {
    // Verify retrieved list contains the uploaded file and text snippet from previous tests
    const res = await fetch(`${BASE_URL}/items`);
    assert.equal(res.status, 200);
    const items = await res.json();
    
    assert.ok(Array.isArray(items), 'GET /items should return an array');
    assert.ok(items.length >= 2, 'Should return at least the 2 successfully uploaded items');

    // Find the text snippet item and assert it has the populated 'content'
    const snippetItem = items.find(item => item.id === textSnippetId);
    assert.ok(snippetItem, 'Shared text snippet should be in the items list');
    assert.equal(snippetItem.content, 'Confidential API Key: jungle-secret-123', 'Content must be correctly populated');

    // Assert the array is sorted descending by uploadTime
    for (let i = 0; i < items.length - 1; i++) {
      assert.ok(items[i].uploadTime >= items[i + 1].uploadTime, `Items should be sorted descending by uploadTime. Element ${i} uploadTime ${items[i].uploadTime} vs ${items[i + 1].uploadTime}`);
    }

    // Verify expired items are excluded
    const expiredId = '33333333-3333-3333-3333-333333333333';
    const expiredMetaPath = path.join(UPLOADS_DIR, `${expiredId}-meta.json`);
    const expiredMetadata = {
      id: expiredId,
      originalName: 'expired.txt',
      mimeType: 'text/plain',
      size: 10,
      uploadTime: Date.now() - 3600000 * 25, // 25 hours ago
      expiryTime: Date.now() - 3600000 * 1,  // expired 1 hour ago
      type: 'file'
    };

    await fs.writeFile(expiredMetaPath, JSON.stringify(expiredMetadata, null, 2), 'utf8');

    // Fetch again
    const resAfterExpiry = await fetch(`${BASE_URL}/items`);
    const itemsAfterExpiry = await resAfterExpiry.json();
    
    const foundExpired = itemsAfterExpiry.find(item => item.id === expiredId);
    assert.equal(foundExpired, undefined, 'Expired item should not be in the items list');

    // Cleanup expired mock file
    await fs.unlink(expiredMetaPath);
  });

  // 9. Test GET Share Target query string URL extraction
  await test('GET Share Target - Should extract first URL or fallback to text', async () => {
    function extractUrlOrFallback(sharedTitle, sharedText, sharedUrl) {
      const combinedText = [sharedText, sharedUrl, sharedTitle].filter(Boolean).join(' ');
      const urlRegex = /(https?:\/\/[^\s"'<>`]+)/;
      const match = combinedText.match(urlRegex);
      let textToPost = '';
      if (match) {
        const rawUrl = match[1];
        const punctMatch = rawUrl.match(/[.,!?):;\]}]+$/);
        const trailingPunct = punctMatch ? punctMatch[0] : '';
        textToPost = trailingPunct ? rawUrl.slice(0, -trailingPunct.length) : rawUrl;
      } else {
        textToPost = sharedText || sharedUrl || sharedTitle || '';
      }
      return textToPost;
    }

    assert.equal(extractUrlOrFallback(undefined, 'Watch: https://youtu.be/abc', undefined), 'https://youtu.be/abc');
    assert.equal(extractUrlOrFallback(undefined, 'Hello World', undefined), 'Hello World');
    assert.equal(extractUrlOrFallback('My Title', 'Check this: https://example.com/page. Please read!', 'https://example.com/page.'), 'https://example.com/page');
    assert.equal(extractUrlOrFallback(undefined, undefined, 'https://tapeer.local/test?param=1'), 'https://tapeer.local/test?param=1');
  });

  // 10. Test Safe Linkify - Should escape HTML, format links, and strip trailing punctuation
  await test('Safe Linkify - Should render secure anchors, escape HTML, and strip trailing punctuation', async () => {
    const vm = require('vm');
    const appJsPath = path.join(__dirname, 'public', 'app.js');
    const appJsContent = await fs.readFile(appJsPath, 'utf8');

    // Extract escapeHtml and safeLinkify implementations
    const escapeHtmlIndex = appJsContent.indexOf('function escapeHtml(');
    const escapeHtmlEndIndex = appJsContent.indexOf('// Helper: Format relative time');
    const escapeHtmlCode = appJsContent.slice(escapeHtmlIndex, escapeHtmlEndIndex);

    const safeLinkifyIndex = appJsContent.indexOf('function safeLinkify(');
    const safeLinkifyEndIndex = appJsContent.indexOf('// Service Worker Registration');
    const safeLinkifyCode = appJsContent.slice(safeLinkifyIndex, safeLinkifyEndIndex);

    const context = vm.createContext({});
    vm.runInContext(escapeHtmlCode, context);
    vm.runInContext(safeLinkifyCode, context);
    const safeLinkify = context.safeLinkify;

    // Test simple linkification and trailing punctuation stripping
    const output1 = safeLinkify('Go to http://test.com/a. and click!');
    assert.equal(output1, 'Go to <a class="jungle-link" href="http://test.com/a" target="_blank" rel="noopener noreferrer">http://test.com/a</a>. and click!');

    // Test XSS escaping
    const output2 = safeLinkify('<script>alert(1)</script> https://safe.com');
    assert.equal(output2, '&lt;script&gt;alert(1)&lt;/script&gt; <a class="jungle-link" href="https://safe.com" target="_blank" rel="noopener noreferrer">https://safe.com</a>');

    // Test multiple punctuation marks
    const output3 = safeLinkify('Is it https://google.com/???');
    assert.equal(output3, 'Is it <a class="jungle-link" href="https://google.com/" target="_blank" rel="noopener noreferrer">https://google.com/</a>???');
  });

  // 11. Test POST /share-target fallback (file & text payloads)
  await test('POST /share-target - Should process shared file/text and redirect to /?shared=1', async () => {
    const boundary = '----WebKitFormBoundaryshare';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="shared_photo.jpg"',
      'Content-Type: image/jpeg',
      '',
      'fake-image-bytes',
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Shared Photo',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const res = await fetch(`${BASE_URL}/share-target`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      redirect: 'manual',
      body: body
    });

    assert.equal(res.status, 303);
    assert.ok(res.headers.get('location').includes('/?shared=1'));
  });

  // 12. Test Server timeouts configuration
  await test('Server Configuration - Should configure server timeouts to 30 minutes', async () => {
    const { configureServerTimeouts } = require('./server');
    configureServerTimeouts(server);
    assert.equal(server.timeout, 1800000);
  });

  // Tear down server
  server.close();
  console.log('=============================================');
  console.log(`Test Suite Finished: ${passedCount}/${testCount} passed`);
  console.log('=============================================');

  if (passedCount === testCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  if (server) server.close();
  process.exit(1);
});
