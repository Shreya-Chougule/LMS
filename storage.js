/* ========================================
   LearnHub LMS — Storage Upload Module
   Provides file upload helpers and a
   reusable drag-and-drop upload widget.
   Requires api.js to be loaded first.
   ======================================== */

// ---- Bucket Config (client-side mirrors) ----
const STORAGE_BUCKETS = {
  'course-pdfs': {
    maxSize: 20 * 1024 * 1024,
    allowedMimes: ['application/pdf'],
    accept: '.pdf',
    label: 'PDF',
    icon: '📄'
  },
  'avatars': {
    maxSize: 5 * 1024 * 1024,
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    accept: '.jpg,.jpeg,.png,.webp,.gif',
    label: 'Image',
    icon: '🖼️'
  }
};

// ---- Upload a file to storage via backend ----
async function uploadFileToStorage(file, bucket, courseId, onProgress) {
  const token = localStorage.getItem('lms_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  if (courseId) formData.append('courseId', courseId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/storage/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Upload failed'));
        }
      } catch (e) {
        console.error('Upload raw response:', xhr.status, xhr.responseText);
        reject(new Error(xhr.responseText || 'Invalid server response'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.send(formData);
  });
}

// ---- Delete a file from storage ----
async function deleteFileFromStorage(bucket, filePath) {
  const params = new URLSearchParams({ bucket, path: filePath });
  return apiRequest(`/storage/delete?${params.toString()}`, 'DELETE');
}

// ---- Get a signed URL for private file ----
async function getSignedDownloadUrl(bucket, filePath) {
  const params = new URLSearchParams({ bucket, path: filePath });
  return apiRequest(`/storage/signed-url?${params.toString()}`);
}

// ---- Format file size ----
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0) + ' ' + units[i];
}

// ---- Validate a file client-side ----
function validateFile(file, bucket) {
  const config = STORAGE_BUCKETS[bucket];
  if (!config) return 'Unknown bucket type';
  if (!config.allowedMimes.includes(file.type)) {
    return `Invalid file type. Allowed: ${config.accept}`;
  }
  if (file.size > config.maxSize) {
    return `File too large (${formatFileSize(file.size)}). Max: ${formatFileSize(config.maxSize)}`;
  }
  return null; // valid
}

// ---- Create a drag-and-drop file upload widget ----
// Options:
//   container  — DOM element to render into
//   bucket     — bucket name string
//   courseId   — course ID for the upload path
//   multiple   — allow multiple files (default false)
//   onUploaded — callback(result) when upload completes
//   onRemoved  — callback(index) when file is removed
function createFileUploadWidget(options) {
  const { container, bucket, courseId, multiple = false, onUploaded, onRemoved } = options;
  const config = STORAGE_BUCKETS[bucket];
  if (!config || !container) return null;

  const widgetId = 'upload-' + Math.random().toString(36).substring(2, 8);
  const uploadedFiles = [];

  container.innerHTML = `
    <div class="file-upload-widget" id="${widgetId}">
      <div class="file-drop-zone" id="${widgetId}-dropzone">
        <div class="drop-zone-icon">${config.icon}</div>
        <p class="drop-zone-text">Drag & drop your ${config.label.toLowerCase()} here</p>
        <p class="drop-zone-hint">or click to browse · ${config.accept} · max ${formatFileSize(config.maxSize)}</p>
        <input type="file" class="file-input-hidden" id="${widgetId}-input" accept="${config.accept}" ${multiple ? 'multiple' : ''}>
      </div>
      <div class="file-upload-list" id="${widgetId}-list"></div>
    </div>
  `;

  const dropzone = document.getElementById(`${widgetId}-dropzone`);
  const fileInput = document.getElementById(`${widgetId}-input`);
  const fileList = document.getElementById(`${widgetId}-list`);

  // Click to browse
  dropzone.addEventListener('click', (e) => {
    if (e.target === fileInput) return;
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });

  // Drag events
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const error = validateFile(file, bucket);
      if (error) {
        showToast(error, 'error');
        return;
      }

      if (!multiple) {
        // Clear previous
        fileList.innerHTML = '';
        uploadedFiles.length = 0;
      }

      addFileItem(file);
    });
  }

  function addFileItem(file) {
    const index = uploadedFiles.length;
    const itemId = `${widgetId}-file-${index}`;

    const item = document.createElement('div');
    item.className = 'file-upload-item';
    item.id = itemId;
    item.innerHTML = `
      <div class="file-item-info">
        <span class="file-item-icon">${config.icon}</span>
        <div class="file-item-details">
          <p class="file-item-name">${file.name}</p>
          <p class="file-item-size">${formatFileSize(file.size)}</p>
        </div>
        <span class="file-item-status uploading">Uploading...</span>
        <button type="button" class="file-item-remove" title="Remove">✕</button>
      </div>
      <div class="file-progress-bar">
        <div class="file-progress-fill" id="${itemId}-progress" style="width:0%"></div>
      </div>
    `;

    fileList.appendChild(item);

    const removeBtn = item.querySelector('.file-item-remove');
    const statusEl = item.querySelector('.file-item-status');
    const progressEl = document.getElementById(`${itemId}-progress`);

    // Start upload
    const fileEntry = { file, path: null, result: null, element: item };
    uploadedFiles.push(fileEntry);

    uploadFileToStorage(file, bucket, courseId, (pct) => {
      progressEl.style.width = pct + '%';
    }).then(result => {
      fileEntry.path = result.path;
      fileEntry.result = result;
      statusEl.textContent = 'Uploaded ✓';
      statusEl.className = 'file-item-status success';
      progressEl.style.width = '100%';
      progressEl.classList.add('complete');

      if (onUploaded) onUploaded(result, index);
    }).catch(err => {
      statusEl.textContent = 'Failed';
      statusEl.className = 'file-item-status error';
      progressEl.classList.add('error');
      showToast(err.message || 'Upload failed', 'error');
    });

    removeBtn.addEventListener('click', () => {
      // If already uploaded, delete from storage
      if (fileEntry.path) {
        deleteFileFromStorage(bucket, fileEntry.path).catch(() => {});
      }
      item.remove();
      const idx = uploadedFiles.indexOf(fileEntry);
      if (idx > -1) uploadedFiles.splice(idx, 1);
      if (onRemoved) onRemoved(idx);
    });
  }

  return {
    getUploadedFiles: () => uploadedFiles.filter(f => f.result).map(f => f.result),
    clear: () => { fileList.innerHTML = ''; uploadedFiles.length = 0; }
  };
}
