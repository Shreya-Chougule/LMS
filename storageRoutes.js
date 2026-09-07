const express = require('express');
const router = express.Router();
const { upload, uploadFile, deleteFile, getSignedUrl } = require('../controllers/storageController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Upload a file
// — avatars: any authenticated user
// — course-pdfs: instructor/admin only
router.post('/upload', requireAuth, upload.single('file'), (req, res, next) => {
    const bucket = req.body.bucket;
    if (bucket !== 'avatars') {
        return requireRole('instructor', 'admin')(req, res, next);
    }
    next();
}, uploadFile);

// Delete a file (instructor/admin only)
router.delete('/delete', requireAuth, requireRole('instructor', 'admin'), deleteFile);

// Get a signed URL (any authenticated user)
router.get('/signed-url', requireAuth, getSignedUrl);

module.exports = router;
