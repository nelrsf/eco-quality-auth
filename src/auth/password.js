const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const CryptoJS = require("crypto-js");
dotenv.config();

function storeRecoveryCode(code, email) {
  return new Promise(async (resolve, reject) => {
    // Connection URI
    const uri = process.env.USERS_DATABASE;

    // Create a new MongoClient
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    try {
      // Connect to the MongoDB cluster
      await client.connect();

      const module = "Administración";
      const table = "Usuarios";

      // Use the client to access the database
      const db = client.db(module);

      // Perform database operations
      const updateObj = {
        recoveryCode: code
      };
      console.log(email)
      const response = await db.collection(table).updateOne(
        {
          Email: email,
        },
        {
          $set: updateObj,
        }
      );
      if (!response || response?.matchedCount == 0) {
        reject("Error al guardar el código de recuperación");
        return;
      }
      resolve("Código de recuperación guardado correctamente");
    } catch (err) {
      console.error(err);
      reject("Error de conexión en la base de datos de usuarios");
    } finally {
      await client.close();
    }
  });
}

async function storePassword(hash, salt, email) {
  return new Promise(async (resolve, reject) => {
    // Connection URI
    const uri = process.env.USERS_DATABASE;

    // Create a new MongoClient
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    try {
      // Connect to the MongoDB cluster
      await client.connect();

      const module = "Administración";
      const table = "Usuarios";

      // Use the client to access the database
      const db = client.db(module);

      // Perform database operations
      const updateObj = {
        password: hash,
        salt: salt,
      };
      updateObj["Cambio de contraseña"] = false;
      const response = await db.collection(table).updateOne(
        {
          Email: email,
        },
        {
          $set: updateObj,
        }
      );
      if (!response || response?.matchedCount == 0) {
        reject("Error al guardar contraseña");
        return;
      }
      resolve("Contraseña cambiada correctamente");
    } catch (err) {
      console.error(err);
      reject("Error de conexión en la base de datos de usuarios");
    } finally {
      await client.close();
    }
  });
}

function generateRecoveryCode(email, timeStamp) {
  const recoveryCode = generatePassword(8);
  const encoded = CryptoJS.AES.encrypt(recoveryCode, process.env.RECOVERY_CODE_KEY2).toString();
  const payload = {
    Email: email,
    expirationDate: getExpiratiionTime(timeStamp),
    recoveryCode: encoded
  }

  return CryptoJS.AES.encrypt(JSON.stringify(payload), process.env.RECOVERY_CODE_KEY).toString();
}

function getExpiratiionTime(timeStamp){
  const timeToAdd = 1 * 5 * 60 * 1000; 
  return new Date(timeStamp + timeToAdd);
}

function generatePassword(length) {
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "@#$%*./-";

  const allChars = lowerChars + upperChars + digits + specialChars;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  return password;
}

function createHash(password) {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex");
    // Hash the password with the salt using bcrypt
    bcrypt.hash(password + salt, 10, function (err, hash) {
      if (err) {
        reject(err);
      } else {
        resolve({
          salt: salt,
          hash: hash,
        });
      }
    });
  });
}

function validateHash(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function validatePasswordRecoveryCode(code, email){
  try{
    const urlDecoded = Buffer.from(code, 'base64url').toString('utf8');
    const decoded = CryptoJS.AES.decrypt(urlDecoded, process.env.RECOVERY_CODE_KEY).toString(CryptoJS.enc.Utf8);
    const jsonDecoded = JSON.parse(decoded);
    if(jsonDecoded?.Email !== email){
      return false;
    } 
    const exp = new Date(jsonDecoded.expirationDate).getTime();
    const currentDate = new Date().getTime();
    if(exp < currentDate){
      return false;
    }
    if(!validatePasswordRecoveryCode2(jsonDecoded?.recoveryCode)){
      return false;
    }
    return true;
  } catch (e) {
    console.log(e)
    return false;
  }
}

function validatePasswordRecoveryCode2(code){
  try{
    const decoded = CryptoJS.AES.decrypt(code, process.env.RECOVERY_CODE_KEY2).toString(CryptoJS.enc.Utf8);
    return decoded? true : false;
  } catch (e) {
    console.log(e)
    return false;
  }
}

module.exports = {
  generatePassword,
  generateRecoveryCode,
  createHash,
  validateHash,
  storePassword,
  storeRecoveryCode,
  validatePasswordRecoveryCode
};
