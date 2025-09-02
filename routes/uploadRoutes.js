import express from 'express';
import { 
    uploadSingleImage, 
    uploadMultipleImages, 
    deleteImage, 
    getImageInfo,
    updateProfilePicture 
} from '../controller/uploadController.js';
import { 
    uploadSingle, 
    uploadMultiple, 
    handleUploadError 
} from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Upload single image (requires authentication)
router.post('/single', authenticateToken, uploadSingle, handleUploadError, uploadSingleImage);

// Upload multiple images (requires authentication)
router.post('/multiple', authenticateToken, uploadMultiple, handleUploadError, uploadMultipleImages);

// Update user profile picture (requires authentication)
router.post('/profile-picture', authenticateToken, uploadSingle, handleUploadError, updateProfilePicture);

// Delete image (requires authentication)
router.delete('/:publicId', authenticateToken, deleteImage);

// Get image info (public route - no authentication required)
router.get('/info/:publicId', getImageInfo);

export default router;
