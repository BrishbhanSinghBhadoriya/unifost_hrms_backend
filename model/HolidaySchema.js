import mongoose from "mongoose";
const HolidaySchema = new mongoose.Schema({
    name: String,
    date: Date,
    region: String  
  });
  const Holiday = mongoose.model("Holiday", HolidaySchema);
  export default Holiday;