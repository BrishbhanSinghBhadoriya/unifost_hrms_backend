import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        // Check if file is PDF
        if (file.mimetype === 'application/pdf') {
            return {
                folder: 'unifost-hrms/documents',
                resource_type: 'raw',
                allowed_formats: ['pdf']
            };
        } else {
            // For images
            return {
                folder: 'unifost-hrms/images',
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                transformation: [
                    { width: 500, height: 500, crop: 'limit' }, // Resize images
                    { quality: 'auto' } // Auto optimize quality
                ]
            };
        }
    }
});

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type - allow images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files and PDFs are allowed!'), false);
        }
    }
});

// Middleware for single image upload
export const uploadSingle = upload.single('image');

// Middleware for multiple images upload
export const uploadMultiple = upload.array('images', 5); // Max 5 images

// Middleware to accept any field name (single or multiple)
export const uploadAny = upload.any();

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'error',
                message: 'Too many files. Maximum 5 files allowed.'
            });
        }
    }
    
    if (error.message === 'Only image files and PDFs are allowed!') {
        return res.status(400).json({
            status: 'error',
            message: 'Only image files and PDFs are allowed!'
        });
    }
    
    next(error);
};
