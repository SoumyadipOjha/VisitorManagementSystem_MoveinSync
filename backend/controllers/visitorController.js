const Visitor = require('../models/Visitor');
const { sendEmail } = require('../utils/emailService');
const Employee = require('../models/Employee');

const visitorController = {
    registerVisitor: async (req, res) => {
        try {
            const { fullName, contact, purpose, hostEmployee, timeSlot } = req.body;
            const photo = req.file ? `/uploads/${req.file.filename}` : null;

            const newVisitor = new Visitor({
                fullName,
                contact,
                purpose,
                hostEmployee,
                timeSlot,
                photo,
                status: 'pending'
            });

            const savedVisitor = await newVisitor.save();
            const host = await Employee.findOne({ name: hostEmployee });

            if (host) {
                await sendEmail({
                    to: host.email,
                    subject: "New Visitor Registered",
                    text: `New visitor: ${fullName} for ${purpose} at ${timeSlot}`
                });
            }

            res.status(201).json(savedVisitor);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const validStatuses = ["pending", "approved", "rejected", "checked-in", "checked-out"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            const visitor = await Visitor.findById(id);
            if (!visitor) {
                return res.status(404).json({ error: "Visitor not found" });
            }

            const updateFields = { 
                status,
                ...(status === "checked-in" && { checkInTime: new Date() }),
                ...(status === "checked-out" && { checkOutTime: new Date() })
            };

            const updatedVisitor = await Visitor.findByIdAndUpdate(
                id,
                updateFields,
                { new: true }
            );

            res.json(updatedVisitor);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getVisitors: async (req, res) => {
        try {
            const visitors = await Visitor.find({ hostEmployee: req.user.name });
            res.json(visitors);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = visitorController;
