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

function sendChangedPasswordEmail(email) {
  return new Promise((resolve, reject) => {
    // Definir el mensaje
    const message = {
      from: "nel.rsf@gmail.com",
      to: email,
      subject: "Cambio de contraseña ECO-QUALITY",
      text: `Se ha cambiado la contraseña de la cuenta ${email}, si ud no ha hecho este cambio por favor comuniquese al correo nel.rsf@gmail.com`,
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

function sendRecoveryPasswordEmail(code, email, origin) {
  return new Promise((resolve, reject) => {

    const encodedParam = Buffer.from(code).toString('base64')
    // Definir el mensaje
    const message = {
      from: "nel.rsf@gmail.com",
      to: email,
      subject: "Solicitud cambio de contraseña ECO-QUALITY",
      html: `Se ha solicitado recuperar la contraseña de la cuenta ${email}, si usted no ha hecho este cambio, por favor comuníquese al correo nel.rsf@gmail.com<br><br>Para recuperar la contraseña haga clic en el siguiente enlace:<br>${origin}${encodedParam} <br>Este enlace de recuperación tiene un tiempo de validez de 5 minutos`,
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

module.exports = {
  sendSignUpEmail,
  sendChangedPasswordEmail,
  sendRecoveryPasswordEmail
};
