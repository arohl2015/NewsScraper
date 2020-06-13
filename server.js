var express = require("express");
var handlebars = require("express-handlebars");
var mongoose = require("mongoose");
// Requiring all models
var db = require("./models");

//setting the PORT
const PORT = process.env.PORT || 3000;
// If deployed, use the deployed database. Otherwise use my localhost mongoDB I named
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines1";
// Initializing Express
var app = express();

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

//set up handlebars
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

require("./routes/routes")(app);

mongoose.connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });