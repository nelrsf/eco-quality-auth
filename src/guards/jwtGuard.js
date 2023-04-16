const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

function verifyToken(req, res, next) {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).send('Token no suministrado');
    }
 
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).send('Token no válido');
    }
  }

  module.exports = verifyToken;