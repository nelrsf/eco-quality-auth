const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const email = process.env.EMAIL_TRANSPORTER;

// Configurar el transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: process.env.EMAIL_TRANSPORTER_PASSWORD
  },
});

function sendSignUpEmail(email, password) {
  return new Promise((resolve, reject) => {
    // Definir el mensaje
    const message = {
      from: "nel.rsf@gmail.com",
      to: email,
      subject: "Creación de cuenta ECO-QUALITY",
      text: `Se ha creado el usuario ${email} con la contraseña ${password}`,
    };
    // Enviar el mensaje
    transporter.sendMail(message, function (err, info) {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

module.exports = sendSignUpEmail;
