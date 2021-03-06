//after working with my tutor, she suggested moving all my routes from the server file
//to a separate route file - also removed partials from handlebars

// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("../models")

module.exports = function (app) {
    app.get("/scrape", function (req, response) {
        // First, we grab the body of the html with axios
        axios.get("https://www.buzzfeed.com/").then(function(response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);
            // Now, we grab every h2 within an article tag, and do the following:
            $("article h2").each(function (i, element) {
                // Save an empty result object
                var result = {};
                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this)
                    .children("a")
                    .text();
                result.link = $(this)
                    .children("a")
                    .attr("href");
                // if (result.title && result.link) {
                    db.Article.create(result).then(function (dbArticle) {
                      console.log(dbArticle); 
                    }).catch(function (err) {
                        console.log(err);
                    });
            })
            .limit(50);
        }).catch(function (err) {
            console.log(err);
            res.send("Error: no new articles");
        });
    });

    // home route
    app.get("/", function(req, res) {
        db.Article.find({}).limit(50).lean()
            .then(function (dbArticle) {
                // If we were able to successfully find Articles, send them back to the client
                var retrievedArticles = dbArticle;
               var hbsObject;
                hbsObject = {
                    articles: dbArticle
                };
                res.render("index", hbsObject);
            })
            .catch(function (err) {
                // If an error occurred, send it to the client
                res.json(err);
            });
    });
//route to see all saved articles
    app.get("/saved", function(req, res){
        db.Article.find({ saved: true })
          .then(function (retrievedArticles) {
            console.log(JSON.stringify(retrievedArticles))
            // If we were able to successfully find Articles, send them back to the client
            var hbsObject;
            hbsObject = {
              articles: retrievedArticles
            };
            res.render("saved", hbsObject);
          })
          .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
          });
      });
// route to get all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({}).lean()
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

//route to save article
app.put("/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true })
      .then(function (data) {
        console.log(data)
        // If we were able to successfully find Articles, send them back to the client
        res.json(data);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

// //route to remove saved option
// app.put("/remove/:id", function (req, res) {
//     db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false })
//       .then(function (data) {
//         // If we were able to successfully find Articles, send them back to the client
//         res.json(data)
//       })
//       .catch(function (err) {
//         // If an error occurred, send it to the client
//         res.json(err);
//       });
//   });

  app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function (dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for saving/updating an Article's associated Note
  app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function (dbNote) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  app.get("/delete/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Article.findByIdAndRemove({ _id: req.params.id })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
}
