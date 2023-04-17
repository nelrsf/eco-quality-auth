const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv");
dotenv.config();

async function findUser(req, res, next) {
  // Connection URI
  const uri = process.env.USERS_DATABASE;

  // Create a new MongoClient
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    const email = req.body.Email;
    const column = "Email";
    const module = "Administración";
    const table = "Usuarios";

    // Use the client to access the database
    const db = client.db(module);

    // Perform database operations
    const filterObj = {};
    filterObj[column] = email;
    const user = await db.collection(table).findOne(filterObj);
    if (!user) {
      res.status(401).send("Usuario no encontrado");
      return;
    }
    req.body.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).send("Error de conexión en la base de datos de usuarios");
  } finally {
    await client.close();
  }
}

module.exports = findUser;
