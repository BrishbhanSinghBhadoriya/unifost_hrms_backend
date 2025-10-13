import mongoose from "mongoose";
const AnnouncementSchema = new mongoose.Schema({    
    subject: { type: String, required: true },
    targetAudience: { type: [String], enum: ["all", "employee", "manager", "hr", "admin"], default: "all", required: true },
    publishedDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    body: { type: String, required: true },
    image: { type: String,  },
    document: { type: String,  },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },

});
const Announcement = mongoose.model("Announcement", AnnouncementSchema);
export default Announcement;