const express = require("express");
const app = express();
const auth = require("./auth/auth");
const bodyParser = require("body-parser");
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use("/auth", auth);

app.listen(process.env.PORT | 3001, () => {
  console.log(`app listening...`);
});
