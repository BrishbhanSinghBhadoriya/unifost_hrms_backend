import User from '../model/userSchema.js';
import cloudinary from '../config/cloudinary.js';
import Announcement from '../model/AnnouncementSchema.js';

// Upload single image
export const uploadSingleImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No image file provided'
            });
        }

        // Get user from authenticated request
        const userId = req.user._id;

        // Update user profile picture in database
        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture: req.file.path },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Image uploaded successfully',
            data: {
                imageUrl: req.file.path,
                publicId: req.file.filename,
                user: {
                    _id: user._id,
                    username: user.username,
                    name: user.name,
                    profilePicture: user.profilePicture
                }
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error uploading image',
            error: error.message
        });
    }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No image files provided'
            });
        }

        const imageUrls = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            size: file.size
        }));

        res.status(200).json({
            status: 'success',
            message: `${req.files.length} images uploaded successfully`,
            data: {
                images: imageUrls,
                count: req.files.length
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error uploading images',
            error: error.message
        });
    }
};
export const multipleuploadImages = async (req, res) => {
    try {
        // Check if files are provided
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No images provided'
            });
        }

        const uploadedImages = [];
        const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        // Process each image
        for (const file of req.files) {
            try {
                // Validate image type
                if (!allowedImageMimes.includes(file.mimetype)) {
                    try { await fs.unlink(file.path); } catch (e) { }
                    return res.status(400).json({
                        status: 'error',
                        message: `Invalid file type: ${file.originalname}. Allowed: JPEG, JPG, PNG, GIF, WEBP`
                    });
                }

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'unifost-hrms/images',
                    resource_type: 'image'
                });

                uploadedImages.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalName: file.originalname,
                    size: result.bytes,
                    format: result.format
                });

                // Cleanup local file
                try { await fs.unlink(file.path); } catch (e) { }

            } catch (uploadError) {
                console.error(`Error uploading ${file.originalname}:`, uploadError);
                // Cleanup local file
                try { await fs.unlink(file.path); } catch (e) { }
                
                // If any upload fails, cleanup already uploaded images
                for (const uploaded of uploadedImages) {
                    try {
                        await cloudinary.uploader.destroy(uploaded.publicId);
                    } catch (e) { }
                }

                return res.status(500).json({
                    status: 'error',
                    message: `Failed to upload ${file.originalname}`,
                    error: uploadError.message
                });
            }
        }

        res.status(200).json({
            status: 'success',
            message: `${uploadedImages.length} image(s) uploaded successfully`,
            data: {
                images: uploadedImages,
                count: uploadedImages.length
            }
        });

    } catch (error) {
        console.error('Upload images error:', error);
        
        // Cleanup any local files
        if (req.files) {
            for (const file of req.files) {
                try { await fs.unlink(file.path); } catch (e) { }
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Error uploading images',
            error: error.message
        });
    }
};

export const multipleuploadDocuments = async (req, res) => {
    try {
        // Check if files are provided
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No documents provided'
            });
        }

        const uploadedDocuments = [];
        const allowedDocMimes = [
            'application/pdf',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/plain', // .txt
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ];

        // Process each document
        for (const file of req.files) {
            try {
                // Validate document type
                if (!allowedDocMimes.includes(file.mimetype)) {
                    try { await fs.unlink(file.path); } catch (e) { }
                    return res.status(400).json({
                        status: 'error',
                        message: `Invalid file type: ${file.originalname}. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, PPT, PPTX`
                    });
                }

                // Optional: Check file size (e.g., max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    try { await fs.unlink(file.path); } catch (e) { }
                    return res.status(400).json({
                        status: 'error',
                        message: `File too large: ${file.originalname}. Max size: 10MB`
                    });
                }

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'unifost-hrms/documents',
                    resource_type: 'auto' // auto detects file type
                });

                uploadedDocuments.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalName: file.originalname,
                    size: result.bytes,
                    format: result.format
                });

                // Cleanup local file
                try { await fs.unlink(file.path); } catch (e) { }

            } catch (uploadError) {
                console.error(`Error uploading ${file.originalname}:`, uploadError);
                // Cleanup local file
                try { await fs.unlink(file.path); } catch (e) { }
                
                // If any upload fails, cleanup already uploaded documents
                for (const uploaded of uploadedDocuments) {
                    try {
                        await cloudinary.uploader.destroy(uploaded.publicId, { resource_type: 'raw' });
                    } catch (e) { }
                }

                return res.status(500).json({
                    status: 'error',
                    message: `Failed to upload ${file.originalname}`,
                    error: uploadError.message
                });
            }
        }

        res.status(200).json({
            status: 'success',
            message: `${uploadedDocuments.length} document(s) uploaded successfully`,
            data: {
                documents: uploadedDocuments,
                count: uploadedDocuments.length
            }
        });

    } catch (error) {
        console.error('Upload documents error:', error);
        
        // Cleanup any local files
        if (req.files) {
            for (const file of req.files) {
                try { await fs.unlink(file.path); } catch (e) { }
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Error uploading documents',
            error: error.message
        });
    }
};

// Delete image from Cloudinary
export const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                status: 'error',
                message: 'Public ID is required'
            });
        }

        // Delete image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.status(200).json({
                status: 'success',
                message: 'Image deleted successfully',
                data: result
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: 'Image not found or already deleted'
            });
        }

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting image',
            error: error.message
        });
    }
};

// Get image info
export const getImageInfo = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                status: 'error',
                message: 'Public ID is required'
            });
        }

        // Get image info from Cloudinary
        const result = await cloudinary.api.resource(publicId);

        res.status(200).json({
            status: 'success',
            message: 'Image info retrieved successfully',
            data: {
                publicId: result.public_id,
                url: result.secure_url,
                format: result.format,
                width: result.width,
                height: result.height,
                size: result.bytes,
                createdAt: result.created_at
            }
        });

    } catch (error) {
        console.error('Get image info error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting image info',
            error: error.message
        });
    }
};

// Update user profile picture
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No image file provided'
            });
        }

        // Get user from authenticated request
        const userId = req.user._id;

        // Find user and delete old profile picture if exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Delete old profile picture from Cloudinary if exists
        if (user.profilePicture) {
            const oldPublicId = user.profilePicture.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`unifost-hrms/${oldPublicId}`);
        }

        // Update user profile picture
        user.profilePicture = req.file.path;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Profile picture updated successfully',
            data: {
                imageUrl: req.file.path,
                publicId: req.file.filename,
                user: {
                    _id: user._id,
                    username: user.username,
                    name: user.name,
                    profilePicture: user.profilePicture
                }
            }
        });

    } catch (error) {
        console.error('Update profile picture error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating profile picture',
            error: error.message
        });
    }

};

