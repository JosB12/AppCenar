const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  port: 587,
  auth: {
    user: "blancojosue931@gmail.com",
    pass: "qbmciimpdmsgzeui", //pass: qbmc iimp dmsg zeui
  },
  tls:{
    rejectUnauthorized: false,
  }
});

module.exports = transporter;