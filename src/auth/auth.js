const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const {
  generatePassword,
  createHash,
  validateHash,
  storePassword,
  generateRecoveryCode,
  validatePasswordRecoveryCode,
} = require("./password");
const {
  sendSignUpEmail,
  sendRecoveryPasswordEmail,
  sendChangedPasswordEmail,
} = require("../email/email");
const jwt = require("jsonwebtoken");
const jwtGuard = require("../guards/jwtGuard");
const findUser = require("../middlewares/findUser");
const createUser = require("./createUser");
dotenv.config();

router.post("/recoverypassword", findUser, (req, res) => {
  const email = req.body.Email;
  const timeStamp = req.body.timeStamp;
  const code = generateRecoveryCode(email, timeStamp);
  const serverUrl = `${process.env.API_PROTOCOL_STRING}://${req.get("host")}/`;
  sendRecoveryPasswordEmail(code, email, serverUrl)
    .then((_result) => {
      res.status(200).json(_result);
    })
    .catch((error) => {
      res.status(401).json(error);
    });
});

router.post("/login", findUser, async (req, res) => {
  const body = req.body;
  const user = body.user;
  const hashValidation = await validateHash(
    body.password + user.salt,
    user.password
  );
  if (!hashValidation) {
    res.status(401).json("Contraseña invalida");
    return;
  }

  if (user["Cambio de contraseña"]) {
    res.status(200).json({ firstTime: true });
    return;
  }

  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
  if (token) {
    res.status(200).json({ token: token });
  } else {
    res.status(401).json("Error de autenticación");
  }
});

router.post("/changepassword", findUser, async (req, res) => {
  const body = req.body;
  const user = body.user;
  const hashValidation = await validateHash(
    body.password + user.salt,
    user.password
  );
  if (!hashValidation && !body.recoveryCode) {
    res.status(401).json("Contraseña invalida");
    return;
  }

  if (body.recoveryCode) {
    const isValidCode = validatePasswordRecoveryCode(
      body.recoveryCode,
      user.Email
    );
    if (!isValidCode) {
      res.status(401).json("Código de recuperación inválido");
      return;
    }
  }

  const { hash, salt } = await createHash(body.newPassword);
  storePassword(hash, salt, user.Email)
    .then((result) => {
      sendChangedPasswordEmail(user.Email);
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(401).json(error);
    });
});

router.post("/validate", jwtGuard, (req, res) => {
  return res.status(200).send(req.user);
});

router.post("/signup", async (req, res) => {
  const body = req.body;
  const { result, params } = checkParams(body);
  if (!result) {
    res
      .status(400)
      .send(`Parámetro(s) ${params.join(", ")} no suministrado(s)`);
    return;
  }
  body["Cambio de contraseña"] = true;
  body["Cuenta confirmada"] = false;
  const password = generatePassword(10);
  const { hash, salt } = await createHash(password);
  body["password"] = hash;
  body["salt"] = salt;

  createUser(body)
    .then((_response) => {
      userCreatedHandler(res, body.Email, password);
    })
    .catch((error) => {
      userCreatedFailedHandler(res, error);
    });
});

function userCreatedHandler(responseHandler, email, password) {
  sendSignUpEmail(email, password)
    .then((_response) => {
      responseHandler.status(200).json(`Usuario creado correctamente, se ha enviado la contraseña al correo ${email}`);
    })
    .catch((_error) => {
      responseHandler
        .status(409)
        .json("No fue posible enviar el correo de confirmación");
    });
}

function userCreatedFailedHandler(responseHandler, error) {
  const errorMessage = error.response ? error.response.data : error;
  const status = error.response ? error.response.status : 400;
  responseHandler.status(status).send(errorMessage);
}

function checkParams(body) {
  const params = [];
  let result = true;
  if (!body["Nombre"]) {
    params.push("Nombre");
    result = false;
  }
  if (!body["Email"]) {
    params.push("Email");
    result = false;
  }
  return {
    result: result,
    params: params,
  };
}

module.exports = router;
