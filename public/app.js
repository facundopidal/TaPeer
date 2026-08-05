// TaPeer Frontend Application Logic

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const selectedFilename = document.getElementById('selected-filename');
const selectedFilesize = document.getElementById('selected-filesize');
const uploadBtn = document.getElementById('upload-btn');
const cancelUpload = document.getElementById('cancel-upload');

const progressContainer = document.getElementById('progress-container');
const uploadProgress = document.getElementById('upload-progress');
const progressText = document.getElementById('progress-text');

const textForm = document.getElementById('text-form');
const textInput = document.getElementById('text-input');

const resultsContainer = document.getElementById('results-container');
const shareLink = document.getElementById('share-link');
const copyBtn = document.getElementById('copy-btn');

const speechText = document.getElementById('speech-text');

// State Variables
let selectedFile = null;
let quoteInterval = null;
let activeUploadXHR = null;

const TAPIR_QUOTES = [
  "Chewing on your file bits...",
  "A tapir never rushes their forage. Uploading...",
  "Munching through the data leaves...",
  "Wiggling ears to align signals...",
  "Using snout-power to route packet paths...",
  "Storing bytes in the jungle canopy...",
  "Crunching metadata like fresh roots..."
];

// Helper: Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Speech bubble utility
function speak(message) {
  speechText.textContent = message;
}

// Helper: copy to clipboard with fallback
function copyToClipboard(text, button) {
  const performCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for HTTP (non-secure)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Avoid scrolling
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  performCopy().then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    
    // Temporary styling update for visual feedback
    const originalColor = button.style.color;
    const originalBg = button.style.backgroundColor;
    
    button.style.backgroundColor = 'var(--foliage-green)';
    button.style.color = '#ffffff';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.color = originalColor;
      button.style.backgroundColor = originalBg;
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

// Global Drag & Drop Listeners (Snout wiggle when file over screen)
let dragCounter = 0;

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    document.body.classList.add('drag-over');
    speak("Ooh! Is that a file for me? Drop it here!");
  }
});

window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    document.body.classList.remove('drag-over');
    speak("Aw, did you change your mind?");
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  document.body.classList.remove('drag-over');
});

// Dropzone specific drag styles
dropzone.addEventListener('dragenter', () => dropzone.classList.add('drag-active'));
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
dropzone.addEventListener('drop', (e) => {
  dropzone.classList.remove('drag-active');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelection(files[0]);
  }
});

// Click on dropzone triggers input click
dropzone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    handleFileSelection(fileInput.files[0]);
  }
});

function handleFileSelection(file) {
  selectedFile = file;
  selectedFilename.textContent = file.name;
  selectedFilesize.textContent = formatBytes(file.size);
  
  dropzone.classList.add('hidden');
  fileInfo.classList.remove('hidden');
  
  resetStateClasses();
  speak(`Mmm, ${file.name} looks delicious! Click "Feed File to Tapir" below to share it.`);
}

// Cancel Selected File
cancelUpload.addEventListener('click', () => {
  if (activeUploadXHR) {
    activeUploadXHR.abort();
    activeUploadXHR = null;
  }
  selectedFile = null;
  fileInput.value = '';
  if (progressContainer) progressContainer.classList.add('hidden');
  fileInfo.classList.add('hidden');
  dropzone.classList.remove('hidden');
  resetStateClasses();
  speak("Feed me a file or drop a text snippet below! I'll keep it safe for 24 hours.");
});

// State reset utility
function resetStateClasses() {
  document.body.classList.remove('uploading', 'success', 'drag-over');
  resultsContainer.classList.add('hidden');
  if (quoteInterval) {
    clearInterval(quoteInterval);
    quoteInterval = null;
  }
}

// Start Tapir Loading Quotes Rotation
function startUploadingAnimation() {
  document.body.classList.add('uploading');
  document.body.classList.remove('success');
  
  let quoteIndex = 0;
  speak(TAPIR_QUOTES[quoteIndex]);
  
  quoteInterval = setInterval(() => {
    quoteIndex = (quoteIndex + 1) % TAPIR_QUOTES.length;
    speak(TAPIR_QUOTES[quoteIndex]);
  }, 2500);
}

// Success handler
function handleSuccess(url, isSnippet = false) {
  resetStateClasses();
  document.body.classList.add('success');
  
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const fullUrl = new URL(cleanUrl, window.location.href).href;
  shareLink.value = fullUrl;
  resultsContainer.classList.remove('hidden');
  
  if (isSnippet) {
    speak("Yum! Text snippet digested! Copy the link to share it with your friends.");
  } else {
    speak("Burp! File consumed and stored! Copy the download link to share.");
  }

  // Refresh history list immediately
  if (typeof fetchHistory === 'function') {
    fetchHistory();
  }
}

// File Upload Submission with XHR Progress & Client ID
uploadBtn.addEventListener('click', () => {
  if (!selectedFile) return;
  
  startUploadingAnimation();
  uploadBtn.disabled = true;
  cancelUpload.disabled = false;

  if (progressContainer) {
    progressContainer.classList.remove('hidden');
    uploadProgress.value = 0;
    progressText.textContent = '0%';
  }

  const formData = new FormData();
  formData.append('file', selectedFile);

  const xhr = new XMLHttpRequest();
  activeUploadXHR = xhr;
  xhr.open('POST', 'upload', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable && progressContainer) {
      const percent = Math.round((e.loaded / e.total) * 100);
      uploadProgress.value = percent;
      progressText.textContent = `${percent}%`;
    }
  };

  xhr.onload = () => {
    activeUploadXHR = null;
    if (progressContainer) progressContainer.classList.add('hidden');

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const data = JSON.parse(xhr.responseText);
        handleSuccess(data.downloadUrl, false);
        selectedFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        dropzone.classList.remove('hidden');
      } catch (err) {
        resetStateClasses();
        speak("Oops! Failed to parse server response.");
      }
    } else {
      resetStateClasses();
      speak("Oops! I got a stomach ache... The upload failed. Please try again.");
    }
    uploadBtn.disabled = false;
  };

  xhr.onerror = xhr.ontimeout = () => {
    activeUploadXHR = null;
    if (progressContainer) progressContainer.classList.add('hidden');
    resetStateClasses();
    speak("Network error or timeout during upload. Please try again.");
    uploadBtn.disabled = false;
  };

  xhr.onabort = () => {
    activeUploadXHR = null;
    if (progressContainer) progressContainer.classList.add('hidden');
    resetStateClasses();
    speak("Upload cancelled.");
    uploadBtn.disabled = false;
  };

  xhr.send(formData);
});

// Share Text Snippet core function
async function shareText(text, isIngestion = false) {
  if (!text || text.trim() === '') return;

  startUploadingAnimation();
  const submitBtn = textForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  textInput.disabled = true;

  try {
    const response = await fetch('text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Text sharing failed');
    }

    const data = await response.json();
    handleSuccess(data.snippetUrl, true);
    if (!isIngestion) {
      textInput.value = '';
    }
  } catch (error) {
    resetStateClasses();
    speak("Oops! The snippet couldn't be digested. Please try again.");
    console.error(error);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    textInput.disabled = false;
  }
}

// Text Share Submission
textForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = textInput.value;
  await shareText(text);
});

// Copy link to clipboard
copyBtn.addEventListener('click', () => {
  copyToClipboard(shareLink.value, copyBtn);
});

// --- Theme Switch & History Implementation ---

// 1. Theme Selection & Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

function updateThemeUI() {
  const isDark = document.body.classList.contains('dark-mode');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
}

// Initial theme sync
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
} else {
  document.body.classList.remove('dark-mode');
}
updateThemeUI();

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeUI();
});

// 2. Clipboard History Logic
const historyList = document.getElementById('history-list');
const expandedSnippets = new Set();
let latestItems = [];

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Format relative time
function getRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  }
}



function renderHistory(items) {
  if (!items || items.length === 0) {
    historyList.innerHTML = '<p class="no-history">No shared items yet</p>';
    return;
  }

  historyList.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item';
    
    const isText = item.type === 'text';
    const relativeTime = getRelativeTime(item.uploadTime);
    
    if (isText) {
      const content = item.content || '';
      const isLong = content.length > 150;
      const isExpanded = expandedSnippets.has(item.id);
      
      let displayText = content;
      if (isLong && !isExpanded) {
        displayText = content.slice(0, 150) + '...';
      }

      card.innerHTML = `
        <div class="history-item-header">
          <span class="history-item-title">📝 Snippet (${formatBytes(item.size)})</span>
          <span class="history-item-meta">${relativeTime}</span>
        </div>
        <pre class="snippet-preview" id="snippet-preview-${item.id}">${safeLinkify(displayText)}</pre>
        <div class="history-item-actions">
          <button class="btn btn-secondary copy-snippet-btn">Copy</button>
          ${isLong ? `<button class="btn btn-link toggle-expand-btn">${isExpanded ? 'Show Less' : 'Show More'}</button>` : ''}
        </div>
      `;

      card.querySelector('.copy-snippet-btn').addEventListener('click', (e) => {
        copyToClipboard(content, e.target);
      });

      if (isLong) {
        card.querySelector('.toggle-expand-btn').addEventListener('click', () => {
          if (expandedSnippets.has(item.id)) {
            expandedSnippets.delete(item.id);
          } else {
            expandedSnippets.add(item.id);
          }
          renderHistory(latestItems);
        });
      }
    } else {
      card.innerHTML = `
        <div class="history-item-header">
          <span class="history-item-title">📁 ${escapeHtml(item.originalName)}</span>
          <span class="history-item-meta">${relativeTime}</span>
        </div>
        <div class="history-item-meta">Size: ${formatBytes(item.size)}</div>
        <div class="history-item-actions">
          <a href="download/${item.id}" class="btn btn-primary" download>Download</a>
        </div>
      `;
    }
    
    historyList.appendChild(card);
  });
}

async function fetchHistory() {
  try {
    const response = await fetch('items');
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    latestItems = await response.json();
    renderHistory(latestItems);
  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

// Initial fetch and 5s polling
fetchHistory();
setInterval(fetchHistory, 5000);

// Safe Linkification: escape HTML and wrap HTTP/HTTPS URLs in secure anchors
function safeLinkify(text) {
  if (!text) return '';
  const urlRegex = /https?:\/\/[^\s"'<>`]+/g;
  let lastIndex = 0, result = '';
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    result += escapeHtml(text.substring(lastIndex, match.index));
    let rawUrl = match[0];
    const punctMatch = rawUrl.match(/[.,!?):;\]}]+$/);
    const trailingPunct = punctMatch ? punctMatch[0] : '';
    const cleanUrl = trailingPunct ? rawUrl.slice(0, -trailingPunct.length) : rawUrl;
    
    result += `<a class="jungle-link" href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanUrl)}</a>${escapeHtml(trailingPunct)}`;
    lastIndex = urlRegex.lastIndex;
  }
  return result + escapeHtml(text.substring(lastIndex));
}

// Service Worker Registration & Auto-Update Handler
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
        // Force check for SW update on page load
        reg.update();

        // Check for updates when app regains focus
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });
      })
      .catch((err) => console.error('Service Worker registration failed:', err));

    // Reload page once new service worker takes over control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
});

// Web Share Target IndexedDB reader & Query params handler
async function checkPendingSharesFromIDB() {
  if (!('indexedDB' in window)) return false;
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('TaPeerShareDB', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!db.objectStoreNames.contains('pending_shares')) return false;

    const tx = db.transaction('pending_shares', 'readwrite');
    const store = tx.objectStore('pending_shares');
    const getReq = store.getAll();

    const items = await new Promise((resolve, reject) => {
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });

    if (items && items.length > 0) {
      store.clear();
      for (const item of items) {
        if (item.type === 'file' && item.file) {
          handleFileSelection(item.file);
        } else if (item.type === 'text' && item.text) {
          shareText(item.text, true);
        }
      }
      return true;
    }
  } catch (err) {
    console.error('Error reading pending shares from IndexedDB:', err);
  }
  return false;
}

(function handleIncomingShare() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedTitle = urlParams.get('title');
  const sharedText = urlParams.get('text');
  const sharedUrl = urlParams.get('url');
  const isServerShared = urlParams.get('shared');

  if (sharedTitle || sharedText || sharedUrl || isServerShared) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    if (isServerShared) {
      fetchHistory();
      speak("Item shared successfully!");
    }

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

    if (textToPost.trim() !== '') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => shareText(textToPost, true));
      } else {
        shareText(textToPost, true);
      }
    }
  }

  // Check IndexedDB for Service Worker intercepted shares
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => checkPendingSharesFromIDB());
  } else {
    checkPendingSharesFromIDB();
  }
})();
