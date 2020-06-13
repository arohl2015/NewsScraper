//after working with my tutor, she suggested moving all my routes from the server file
//to a separate route file - also removed partials from handlebars

// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
const db = require("../models")

module.exports = function (app) {
    app.get("/scrape", function (req, response) {
        // First, we grab the body of the html with axios
        axios.get("https://www.buzzfeed.com/").then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);
            var count = 0;
            // Now, we grab every h2 within an article tag, and do the following:
            $("article h2").each(function (i, element) {
                // Save an empty result object
                var result = {};
                var count = i;
                // Add the text and href of every link, and save them as properties of the result object
                result.title = $(this)
                    .children("a")
                    .text();
                result.link = $(this)
                    .children("a")
                    .attr("href");
                if (result.title && result.link) {
                    db.Article.create(result).then(function (dbArticle) {
                      console.log(dbArticle);  
                      count++;
                    }).catch(function (err) {
                        console.log(err);
                    });
                };
            });
            // response.redirect('/');
        }).catch(function (err) {
            console.log(err);
            res.send("Error: Unable to obtain new articles");
        });
    });

    // home route
    app.get("/", function(req, res) {
        db.Article.find({}).lean()
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
        db.Article.find({ isSaved: true })
          .then(function (retrievedArticles) {
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
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true })
      .then(function (data) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(data);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

//route to remove saved option
app.put("/remove/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: false })
      .then(function (data) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(data)
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
  app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.find({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate({
        path: "note",
        model: "Note"
      })
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
  app.post("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function (dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
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

  app.delete("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.findByIdAndRemove({ _id: req.params.id })
      .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ note: req.params.id }, { $pullAll: [{ note: req.params.id }] });
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
}
