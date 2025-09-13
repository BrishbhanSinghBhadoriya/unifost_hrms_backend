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
    fatherName:{type:String,default:""},
    bloodGroup:{type:String,default:""},
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true },
    address: {
        street: { type: String, default: "" },   
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        zip: { type: String, default: "" },
        country: { type: String, default: "India" }
      },
      
    dob: { type: String, default: "" },  
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    profilePicture: { type: String, default: "" },
    professionalEmailId:{type:String, default: ""},
    emergencyContactNo:{type:Number, default: ""},

    
    // Employment Information
    employeeId: { type: String, required: true, unique: true },
    joiningDate: { type: Date, default: null },
    experience: [
        {
          company: { type: String, required: true,default:" " },
          designation: { type: String, required: true,default:" " },
          startDate: { type: Date, default: null },
          endDate: { type: Date, default: null }, 
          description: { type: String, default: "" } 
        }
      ],
      
      education: [
        {
          degree: { type: String, required: true },   
          institution: { type: String, default: "" }, 
          fieldOfStudy: { type: String, default: "" },
          startDate: { type: Date },
          endDate: { type: Date },
          grade: { type: String, default: "" }        
        }
      ],
      
    
    // Bank Information
    bankDetails: [
        {
          bankName: { type: String, required: true },
          bankAccountNumber: { type: String, required: true },
          bankAccountType: { type: String, enum: ["savings", "current"], default: "savings" },
          bankIFSC: { type: String, required: true },
          bankAccountHolderName: { type: String, required: true },
         
        }
      ],
      
    // Work Details
    department: { type: String, enum: ["IT", "HR", "Marketing", "Sales", "Other"], default: "IT", required: true },
    designation: { type: String, required: true  },
    jobType:{type:String,enum:["FULL TIME" ,"INTERN","FREELANCE"]},
    workMode:{type:String,default:" "},
    lastLogin: { type: Date, default: Date.now },
    
    reportingTo: { 
        type: String,
        trim: true
    },
    documents:{
        adharImage: { type: String, default: "" },
        panImage: { type: String, default: "" },
        experienceLetterImage: { type: String, default: "" },
        MarksheetImage_10: { type: String, default: "" },
        MarksheetImage_12: { type: String, default: "" },
        MarksheetImage_Graduation: { type: String, default: "" },
        MarksheetImage_PostGraduationImage: { type: String, default: "" }
}
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;