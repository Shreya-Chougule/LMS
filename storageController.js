const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');
const multer = require('multer');

// ---- Bucket configuration ----
const BUCKET_CONFIG = {
    'course-pdfs': {
        maxSize: 20 * 1024 * 1024,
        allowedMimes: ['application/pdf'],
        label: 'PDF'
    },
    'avatars': {
        maxSize: 5 * 1024 * 1024, // 5 MB
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        label: 'Image'
    }
};

// ---- Multer setup (memory storage — streams to Supabase) ----
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // global max 20 MB
});

// POST /api/storage/upload
const uploadFile = async (req, res) => {
    try {
        const { bucket } = req.body;
        const courseId = req.body.courseId && req.body.courseId !== 'null' ? req.body.courseId : null;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        if (!bucket || !BUCKET_CONFIG[bucket]) {
            return res.status(400).json({ error: `Invalid bucket. Allowed: ${Object.keys(BUCKET_CONFIG).join(', ')}` });
        }
        if (!courseId && bucket !== 'avatars') {
            return res.status(400).json({ error: 'courseId is required' });
        }

        const config = BUCKET_CONFIG[bucket];

        if (!config.allowedMimes.includes(file.mimetype)) {
            return res.status(400).json({
                error: `Invalid file type "${file.mimetype}" for ${config.label}. Allowed: ${config.allowedMimes.join(', ')}`
            });
        }

        if (file.size > config.maxSize) {
            const maxMB = Math.round(config.maxSize / (1024 * 1024));
            return res.status(400).json({
                error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum for ${config.label}: ${maxMB} MB`
            });
        }

        const uid = req.user.id;

        // Build storage path
        // Avatars: always overwrite the same file per user
        // PDFs: timestamped path under courseId folder
        let storagePath;
        if (bucket === 'avatars') {
            const ext = file.originalname.split('.').pop().toLowerCase();
            storagePath = `${uid}/avatar.${ext}`;
        } else {
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const timestamp = Date.now();
            storagePath = `${uid}/${courseId}/${timestamp}_${sanitizedName}`;
        }

        const upsertFlag = bucket === 'avatars';

        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: upsertFlag
            });

        if (error) {
            console.error('Supabase Storage Upload Error:', error);
            return res.status(400).json({ error: error.message });
        }

        // For public buckets (avatars), return the public URL directly
        let publicUrl = null;
        if (bucket === 'avatars') {
            const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
            publicUrl = urlData?.publicUrl || null;
        }

        res.status(201).json({
            message: 'File uploaded successfully',
            path: data.path,
            bucket,
            fullPath: `${bucket}/${data.path}`,
            publicUrl,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        });
    } catch (error) {
        console.error('Upload Error FULL:', error.message, error.stack);
        res.status(500).json({ error: error.message || 'Server error during file upload' });
    }
};

// DELETE /api/storage/delete?bucket=...&path=...
const deleteFile = async (req, res) => {
    try {
        const { bucket, path: filePath } = req.query;

        if (!bucket || !BUCKET_CONFIG[bucket]) {
            return res.status(400).json({ error: 'Invalid bucket' });
        }
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        const uid = req.user.id;
        if (!filePath.startsWith(uid + '/')) {
            return res.status(403).json({ error: 'You can only delete your own files' });
        }

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            console.error('Supabase Storage Delete Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Server error during file deletion' });
    }
};

// GET /api/storage/signed-url?bucket=...&path=...
const getSignedUrl = async (req, res) => {
    try {
        const { bucket, path } = req.query;

        if (!bucket || !BUCKET_CONFIG[bucket]) {
            return res.status(400).json({ error: 'Invalid bucket' });
        }
        if (!path) {
            return res.status(400).json({ error: 'File path is required' });
        }

        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .createSignedUrl(path, 3600); // 60 minutes

        if (error) {
            console.error('Signed URL Error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ signedUrl: data.signedUrl });
    } catch (error) {
        console.error('Signed URL Error:', error);
        res.status(500).json({ error: 'Server error generating signed URL' });
    }
};

module.exports = { upload, uploadFile, deleteFile, getSignedUrl };
