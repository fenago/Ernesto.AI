// package imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Setting up port
const connUri = process.env.MONGODB_URI;
let PORT = process.env.PORT || 3000;

//=== 1 - CREATE APP
// Creating express app and configuring middleware needed for authentication
const app = express();

app.use(cors());
// for parsing application/json
app.use(express.json());
// for parsing application/xwww-
app.use(express.urlencoded({ extended: false }));
// serve frontend build flder
app.use(express.static(path.join(__dirname, "/public/")));

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;
mongoose.connect(connUri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const db = mongoose.connection;

db.once("open", () =>
  console.log("MongoDB --  database connection established successfully!"),
);
db.on("error", (err) => {
  console.log(
    "MongoDB connection error. Please make sure MongoDB is running. " + err,
  );
  process.exit();
});

// app.use(passport.initialize());
// require("./middlewares/jwt")(passport);

require("./routes/index")(app);

app.listen(PORT, () =>
  console.log("Server running on http://localhost:" + PORT + "/"),
);
