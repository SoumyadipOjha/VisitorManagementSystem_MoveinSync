require('dotenv').config();
const mongoose = require('mongoose');

const dbConfig = {
    url: process.env.MONGO_URI || "mongodb://localhost:27017/visitor-management",
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
};

module.exports = dbConfig;const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

const transporter = nodemailer.createTransport(emailConfig);

const sendEmail = async (options) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            ...options
        });
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
};

module.exports = { sendEmail };
