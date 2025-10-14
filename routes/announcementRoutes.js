const router = express.Router();
import express from "express";
import { createAnnouncement, getAnnouncement, updateAnnouncement, deleteAnnouncement,getAnnouncementById} from "../controller/announcementController.js";
import { authenticateToken } from "../middleware/auth.js";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";
import { uploadAny } from "../middleware/upload.js";

// import { uploadAnnouncementImage, uploadAnnouncementDocument } from "../controller/announcementController.js";
router.post('/createAnnouncement', authenticateToken, createAnnouncement);
router.get('/getAnnouncement', authenticateToken, getAnnouncement);
router.put('/updateAnnouncement/:id', authenticateToken, updateAnnouncement);
router.delete('/deleteAnnouncement/:id', authenticateToken, deleteAnnouncement);
router.get('/getannouncement/:id',authenticateToken,getAnnouncementById)

// router.post('/announcement/:id/image', authenticateToken, uploadSingle, handleUploadError, uploadAnnouncementImage);
// router.post('/announcement/:id/document', authenticateToken, uploadAny, handleUploadError, uploadAnnouncementDocument);
export default router;