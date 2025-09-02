import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
    // Basic Information
    empCode: { 
        type: String, 
        unique: true, 
        required: true,
        trim: true,
        uppercase: true
    },
    firstName: { 
        type: String, 
        required: true, 
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: { 
        type: String, 
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    alternatePhone: { 
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    dob: { 
        type: Date, 
        required: true 
    },
    age: { 
        type: Number,
        min: 18,
        max: 65
    },
    gender: { 
        type: String, 
        enum: ["male", "female", "other"], 
        required: true 
    },
    
    
    // Address Information
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: "India" }
    },
    
    // Emergency Contact
    emergencyContact: {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        address: String
    },
    
    // Employment Information
    jobTitle: { 
        type: String, 
        required: true,
        trim: true
    },
    designation: { 
        type: String, 
        required: true,
        trim: true
    },
    department: { 
        type: String, 
        required: true,
        enum: ["IT", "HR", "Marketing", "Sales", "Finance", "Operations", "Other"],
        default: "IT"
    },
    joiningDate: { 
        type: Date, 
        required: true,
        default: Date.now
    },
    confirmationDate: Date,
    lastWorkingDay: Date,
    
    // Reporting Structure
    managerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Employee",
        default: null
    },
    reportingTo: { 
        type: String,
        trim: true
    },
    
    // Salary & Benefits
    salary: { 
        type: Number, 
        required: true,
        min: 0
    },
    currency: { 
        type: String, 
        default: "INR" 
    },
    salaryStructure: {
        basic: { type: Number, required: true },
        hra: { type: Number, default: 0 },
        da: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 }
    },
    
    // Work Details
    workLocation: { 
        type: String, 
        default: "Office" 
    },
    workMode: { 
        type: String, 
        enum: ["on-site", "remote", "hybrid"], 
        default: "on-site" 
    },
    shift: { 
        type: String, 
        enum: ["day", "night", "rotational"], 
        default: "day" 
    },
    
    // Status & Performance
    status: { 
        type: String, 
        enum: ["active", "inactive", "resigned", "terminated", "suspended"], 
        default: "active" 
    },
    performanceRating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 3 
    },
    lastReviewDate: Date,
    nextReviewDate: Date,
    
    // Documents & Files
    documents: [{
        name: { type: String, required: true },
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        isVerified: { type: Boolean, default: false }
    }],
    
    // Additional Information
    skills: [String],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        isActive: { type: Boolean, default: true }
    }],
    experience: {
        totalYears: { type: Number, default: 0 },
        previousCompanies: [{
            companyName: String,
            position: String,
            fromDate: Date,
            toDate: Date,
            reasonForLeaving: String
        }]
    },
    
    // System Fields
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastLogin: Date,
    profilePicture: String,
    notes: String
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
EmployeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
EmployeeSchema.virtual('age').get(function() {
    if (this.dob) {
        const today = new Date();
        const birthDate = new Date(this.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return null;
});

// Pre-save middleware to update fullName
EmployeeSchema.pre('save', function(next) {
    if (this.firstName && this.lastName) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});

// Indexes for better query performance
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ empCode: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ managerId: 1 });

const Employee = mongoose.model("Employee", EmployeeSchema);
export default Employee;