import express from 'express';
import { 
    uploadSingleImage, 
    uploadMultipleImages, 
    deleteImage, 
    getImageInfo,
    updateProfilePicture ,
    multipleuploadImages,
    multipleuploadDocuments
} from '../controller/uploadController.js';
import { updateEmployeeDocuments, uploadSingleDocument } from '../controller/employeeController.js';

import { 
    uploadSingle, 
    uploadMultiple, 
    uploadAny,
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


router.post('/document/single/:id', authenticateToken, uploadAny, handleUploadError, uploadSingleDocument);


router.post('/document/:id', uploadAny, handleUploadError, updateEmployeeDocuments);

// Upload multiple documents for employee
router.post('/employee/:id/documents', authenticateToken, uploadMultiple, handleUploadError, updateEmployeeDocuments);

router.post('/upload-one-multiple-image',uploadMultiple,handleUploadError,multipleuploadImages);
router.post('/upload-one-multiple-documents',authenticateToken,uploadMultiple,handleUploadError,multipleuploadDocuments)

// Upload announcement image

export default router;
