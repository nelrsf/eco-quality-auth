const crypto = require("crypto");
const bcrypt = require("bcrypt");

function generatePassword(length) {
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "@#$%&*?./-";

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

module.exports = {
  generatePassword,
  createHash,
  validateHash
};
