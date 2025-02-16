require('dotenv').config();

const emailConfig = {
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

module.exports = emailConfig;