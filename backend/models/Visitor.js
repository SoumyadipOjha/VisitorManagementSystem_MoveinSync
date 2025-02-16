const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    contact: { type: String, required: true },
    purpose: { type: String, required: true },
    hostEmployee: { type: String, required: true },
    timeSlot: {
        type: String,
        required: true,
        enum: [
            "9:00 AM - 11:00 AM",
            "11:00 AM - 1:00 PM",
            "1:00 PM - 3:00 PM",
            "3:00 PM - 5:00 PM"
        ]
    },
    status: { type: String, default: "pending" },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    photo: { type: String }
});

module.exports = mongoose.model('Visitor', visitorSchema);
