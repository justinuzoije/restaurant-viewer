const express = require('express');
const Promise = require('bluebird');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');

const dbConfig = require('./db-config');
const db = pgp(dbConfig);

// const db = pgp({
//   database:'restaurantv2_db'
// })

const hbs = require('hbs');


const app = express();

app.use(express.static('public'));

app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: false}));

// This is for the home page
app.get('/', function(req, res) {
  res.render('home_page.hbs', {
  });
});


//This is for the search results page
app.get('/search', function(request, response, next) {
  var term = request.query.searchTerm;

  db.any(`select * from restaurant where name ilike '%${term}%'`)
  // db.any(`select * from restaurant where name ilike '%$1#%'`, {term})
    .then(function(restaurant) {
      response.render('search_results.hbs', {
        restaurant: restaurant
      });
    })
    .catch(next);
});

// app.get('/restaurant/:id', function(request, response, next) {
//   var id = request.params.id;
app.get('/restaurant/:id', function(req, resp, next) {
  let id = req.params.id;
  db.any(`
    select
      reviewer.name as reviewer_name,
      review.title,
      review.stars,
      review.review
    from
      restaurant
    inner join
      review on review.restaurant_id = restaurant.id
    left outer join
      reviewer on review.reviewer_id = reviewer.id
    where restaurant.id = ${id}
  `)
    .then(function(reviews) {
      return [
        reviews,
        db.one(`
          select name as restaurant_name, * from restaurant
          where id = ${id}`)
      ];
    })
    .spread(function(reviews, restaurant) {
      resp.render('restaurant.hbs', {
        restaurant: restaurant,
        reviews: reviews
      });
    })
    .catch(next);
});

app.post('/submit_review/:id', function(req, resp, next) {
  var restaurantId = req.params.id;
  console.log('restaurant ID', restaurantId);
  console.log('from the form', req.body);
  db.none(`insert into review values
    (default, NULL, ${req.body.stars}, '${req.body.title}', '${req.body.review}', ${restaurantId})`)
    .then(function() {
      resp.redirect(`/restaurant/${restaurantId}`);
    })
    .catch(next);
});





app.listen(3000, function() {
  console.log('Listening on port 3000');
});
