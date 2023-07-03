const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

async function createUser(user) {
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

      const module = process.env.EQ_ADMIN_DATABASE;
      const table = process.env.EQ_ADMIN_USERS_COLLECTION;

      // Use the client to access the database
      const db = client.db(module);

      const response = await db.collection(table).insertOne(user);
      if (!response || response?.matchedCount == 0) {
        reject("Error al guardar el usuario");
        return;
      }
      resolve("Usuario creado correctamente");
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        reject(`El usuario ${user.Email} ya existe`);
        return;
      }
      reject("Error de conexión en la base de datos de usuarios");
    } finally {
      await client.close();
    }
  });
}

module.exports = createUser;
