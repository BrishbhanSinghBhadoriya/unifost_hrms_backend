import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    // Authentication & Basic Info
    username: { type: String, unique: true, required: true },  
    password: { type: String, required: true }, 
    role: { type: String, enum: ["employee", "manager", "hr", "admin"], default: "employee" },
    
    // Status Flags
    isAdmin: { type: Boolean, default: false },
    isManager: { type: Boolean, default: false },
    isHR: { type: Boolean, default: false },
    isEmployee: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    
    // Personal Information
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String, default: "India" },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    profilePicture: { type: String },
    
    // Employment Information
    employeeId: { type: String, required: true, unique: true },
    joiningDate: { type: Date },
    salary: { type: Number },
    experience: { type: Number },
    education: { type: String },
    
    // Bank Information
    bankName: { type: String },
    bankAccountNumber: { type: String },
    bankAccountType: { type: String, enum: ["savings", "current"], default: "savings" },
    bankIFSC: { type: String },
    bankAccountHolderName: { type: String },
    
    // Work Details
    department: { type: String, enum: ["IT", "HR", "Marketing", "Sales", "Other"], default: "IT", required: true },
    designation: { type: String, required: true },
    
    // Additional Fields
    skills: [String],
    certifications: [String],
    achievements: [String],
    notes: String,
    lastLogin: { type: Date, default: Date.now }
    
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;