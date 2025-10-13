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

