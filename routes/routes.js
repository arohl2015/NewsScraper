//after working with my tutor, she suggested moving all my routes from the server file
//to a separate route file - also removed partials from handlebars

// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
const db = require("../models")

module.exports = function (app) {
    app.get("/scrape", function (req, response, next) {
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
                        count++;
                    }).catch(function (err) {
                        console.log(err);
                    });
                };
            });
            response.redirect('/');
        }).catch(function (err) {
            console.log(err);
            res.send("Error: Unable to obtain new articles");
        });
    });

    // home route
    app.get("/", function(req, res) {
        db.Article.find({})
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


}
