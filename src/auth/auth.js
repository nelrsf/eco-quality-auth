const express = require("express");
const router = express.Router();
const MongoClient = require("mongoclient");
const axios = require("axios");
const dotenv = require("dotenv");
const { generatePassword, createHash, validateHash } = require("./password");
const sendSignUpEmail = require("../email/email");
const jwt = require("jsonwebtoken");
const jwtGuard = require("../guards/jwtGuard");
const findUser = require("../middlewares/findUser");
dotenv.config();

router.post("/login", findUser , async (req, res) => {
  const body = req.body;
  const user = body.user;
  const hashValidation = await validateHash(
    body.password + user.salt,
    user.password
  );
  if (!hashValidation) {
    res.status(401).send("Contraseña invalida");
    return;
  }
  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
  if (token) {
    res.status(200).send({ token: token });
  } else {
    res.status(401).send("Error de autenticación");
  }
});

router.post("/validate", jwtGuard, (req, res)=>{
  return res.status(200).send(req.user);
})


async function getUser(email) {
  return new Promise((resolve, reject) => {

    const client = MongoClient();
    
    const module = "/Administración";
    const table = "/Usuarios";
    const requestUrl =
      process.env.USERS_DATABASE + "/rows" + module + table + "/Email/" + email;
    axios
      .get(requestUrl)
      .then((result) => {
        resolve(result.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

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
  const module = "/Administración";
  const table = "/Usuarios";
  const reqUrl = process.env.USERS_DATABASE + "/rows/create" + module + table;
  axios
    .post(reqUrl, body)
    .then((_response) => {
      userCreatedHandler(res, body.Email, password);
    })
    .catch((error) => {
      console.log(error);
      const errorMessage = error.response ? error.response.data : error.message;
      const status = error.response ? error.response.status : 400;
      res.status(status).send(errorMessage);
    });
});

function userCreatedHandler(responseHandler, email, password) {
  sendSignUpEmail(email, password)
    .then((_response) => {
      responseHandler.status(200).send("Usuario creado correctamente");
    })
    .catch((_error) => {
      responseHandler
        .status(409)
        .send("No fue posible enviar el correo de confirmación");
    });
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
