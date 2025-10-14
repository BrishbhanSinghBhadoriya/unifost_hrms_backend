import Announcement from "../model/AnnouncementSchema.js";
import cloudinary from "../config/cloudinary.js";

export const createAnnouncement = async (req, res) => {
  try {
      const { subject, targetAudience, publishedDate, expiryDate, body } = req.body;
      
      // Required fields validation
      if (!subject || !targetAudience || !publishedDate || !expiryDate || !body) {
          return res.status(400).json({
              status: 'error',
              message: 'All fields are required'
          });
      }

      const userId = req.user._id;
      if (!userId) 
      {
          return res.status(400).json({
              status: 'error',
              message: 'User id is required'
          });
      }

      // Check if image is provided
      if (!req.files?.image?.[0]) {
          return res.status(400).json({
              status: 'error',
              message: 'Image is required'
          });
      }

      // Check if document is provided
      if (!req.files?.document?.[0]) {
          return res.status(400).json({
              status: 'error',
              message: 'Document is required'
          });
      }

      let imageUrl = null;
      let documentUrl = null;
      let documentPublicId = null;

      // Handle Image Upload
      try {
          const imageFile = req.files.image[0];
          
          // Validate image type
          const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedImageMimes.includes(imageFile.mimetype)) {
              try { await fs.unlink(imageFile.path); } catch (e) { }
              return res.status(400).json({ 
                  status: 'error', 
                  message: 'Invalid image type. Allowed: JPEG, JPG, PNG, GIF, WEBP' 
              });
          }

          const imageResult = await cloudinary.uploader.upload(imageFile.path, { 
              folder: 'unifost-hrms/announcement-images' 
          });
          imageUrl = imageResult.secure_url;
          
          // Cleanup local file
          try { await fs.unlink(imageFile.path); } catch (e) { }
      } catch (error) {
          console.error('Image upload error:', error);
          return res.status(500).json({
              status: 'error',
              message: 'Failed to upload image',
              error: error.message
          });
      }

      // Handle Document Upload
      try {
          const docFile = req.files.document[0];
          
          // Validate document type
          const allowedDocMimes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain'
          ];
          
          if (!allowedDocMimes.includes(docFile.mimetype)) {
              try { await fs.unlink(docFile.path); } catch (e) { }
              // Delete already uploaded image
              if (imageUrl) {
                  try {
                      const imagePublicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                      await cloudinary.uploader.destroy(`unifost-hrms/announcement-images/${imagePublicId}`);
                  } catch (e) { }
              }
              return res.status(400).json({ 
                  status: 'error', 
                  message: 'Invalid document type. Allowed: PDF, DOC, DOCX, TXT' 
              });
          }

          const docResult = await cloudinary.uploader.upload(docFile.path, {
              folder: 'unifost-hrms/announcement-documents',
              resource_type: 'auto'
          });
          
          documentUrl = docResult.secure_url;
          documentPublicId = docResult.public_id;
          
          // Cleanup local file
          try { await fs.unlink(docFile.path); } catch (e) { }
      } catch (error) {
          console.error('Document upload error:', error);
          // Delete already uploaded image
          if (imageUrl) {
              try {
                  const imagePublicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                  await cloudinary.uploader.destroy(`unifost-hrms/announcement-images/${imagePublicId}`);
              } catch (e) { }
          }
          return res.status(500).json({
              status: 'error',
              message: 'Failed to upload document',
              error: error.message
          });
      }

      // Parse targetAudience if it's a string
      const parsedTargetAudience = typeof targetAudience === 'string' 
          ? JSON.parse(targetAudience) 
          : targetAudience;

      // Create Announcement with all data
      const announcement = await Announcement.create({ 
          subject,
          targetAudience: parsedTargetAudience, 
          publishedDate, 
          expiryDate, 
          body,
          createdBy: userId,
          image: imageUrl,
          document: documentUrl,
          documentPublicId: documentPublicId
      });

      res.status(201).json({
          status: 'success',
          message: 'Announcement created successfully',
          data: announcement
      });

  } catch (error) {
      console.error('Create announcement error:', error);
      
      // Cleanup any uploaded files in case of error
      if (req.files?.image?.[0]?.path) {
          try { await fs.unlink(req.files.image[0].path); } catch (e) { }
      }
      if (req.files?.document?.[0]?.path) {
          try { await fs.unlink(req.files.document[0].path); } catch (e) { }
      }
      
      res.status(500).json({
          status: 'error',
          message: 'Error creating announcement',
          error: error.message
      });
  }
};
   export const getAnnouncement = async (req, res) => {
        const announcement = await Announcement.find();
        res.status(200).json({
            status: 'success',
            message: 'Announcement fetched successfully',
            data: announcement
        });
    }
    export const updateAnnouncement = async (req, res) => {
        const { publicId } = req.params;
        const { subject,targetAudience, publishedDate, expiryDate, body } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(publicId, { subject,targetAudience, publishedDate, expiryDate, body }, { new: true });
        res.status(200).json({
            status: 'success',
            message: 'Announcement updated successfully',
            data: announcement
        });
    }
    export const deleteAnnouncement = async (req, res) => {
        const { publicId } = req.params;
        const announcement = await Announcement.findByIdAndDelete(publicId);
        res.status(200).json({
            status: 'success',
            message: 'Announcement deleted successfully',
            data: announcement
        });
    }
    
    

// export const uploadAnnouncementImage = async (req, res) => {
//     try {
//         const { publicId } = req.params;
//         if (!publicId) {
//             return res.status(400).json({
//                 status: 'error',
//                 message: 'Public ID is required'
//             });
//         }
//         const result = await cloudinary.uploader.upload(req.file.path, { folder: 'unifost-hrms/announcement-images' });
//         res.status(200).json({
//             status: 'success',
//             message: 'Announcement image uploaded successfully',
//             data: result
//         });
//         const announcement = await Announcement.findByIdAndUpdate(publicId, { image: result.secure_url }, { new: true });
//         await announcement.save();
//         res.status(200).json({
//             status: 'success',
//             message: 'Announcement image uploaded successfully',
//             data: announcement
//         });
        
//     } catch (error) {
//         console.error('Upload announcement image error:', error);
//         res.status(500).json({
//             status: 'error',
//             message: 'Error uploading announcement image',
//             error: error.message
//         });
//     }
// }
// export const uploadAnnouncementDocument = async (req, res) => {
//     try {
//       const { publicId } = req.params;
//       if (!publicId) {
//         return res.status(400).json({ status: 'error', message: 'Public ID is required' });
//       }
  

//       if (!req.file) {
//         return res.status(400).json({ status: 'error', message: 'No document file provided' });
//       }
  
//       const allowedMimes = [
//         'application/pdf',
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'text/plain'
//       ];
//       if (!allowedMimes.includes(req.file.mimetype)) {
//         try { await fs.unlink(req.file.path); } catch (e) { }
//         return res.status(400).json({ status: 'error', message: 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT' });
//       }
  
//       // 3. Find announcement
//       const announcement = await Announcement.findById(publicId);
//       if (!announcement) {
//         // cleanup local file
//         try { await fs.unlink(req.file.path); } catch (e) {}
//         return res.status(404).json({ status: 'error', message: 'Announcement not found' });
//       }
  
//       // 4. Upload to Cloudinary
//       const folder = 'unifost-hrms/announcement-documents';
//       let uploadResult;
//       try {
//         uploadResult = await cloudinary.uploader.upload(req.file.path, {
//           folder,
//           resource_type: 'auto' // auto lets cloudinary accept pdf/docx etc.
//         });
//       } catch (uploadErr) {
//         console.error('Cloudinary upload failed:', uploadErr);
//         // cleanup local file
//         try { await fs.unlink(req.file.path); } catch (e) { /* ignore */ }
//         return res.status(500).json({ status: 'error', message: 'Failed to upload to Cloudinary', error: uploadErr.message });
//       }
  
     
//       announcement.document = uploadResult.secure_url;
     
//       announcement.documentPublicId = uploadResult.public_id; // e.g. 'unifost-hrms/announcement-documents/abcd1234'
//       await announcement.save();
  
    
//       if (announcement.document /* previously had something */ && announcement.documentPublicId) {
//         await cloudinary.uploader.destroy(announcement.documentPublicId);
//       }
  
//       // 7. Cleanup local file
//       try { await fs.unlink(req.file.path); } catch (e) { /* ignore */ }
  
//       // 8. Single success response
//       return res.status(200).json({
//         status: 'success',
//         message: 'Announcement document uploaded successfully',
//         data: {
//           upload: uploadResult,
//           announcement
//         }
//       });
  
//     } catch (error) {
//       console.error('Upload announcement document error:', error);
//       return res.status(500).json({
//         status: 'error',
//         message: 'Error uploading announcement document',
//         error: error.message
//       });
//     }
//   };
