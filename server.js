var firebase = require("firebase-admin");
var request = require('request');
var sync_request = require('sync-request');

firebase.initializeApp({
  credential: firebase.credential.cert("./easyjoke-125356ae6579.json"),
  databaseURL: "https://easyjoke-85be9.firebaseio.com"
})

function writeCategoryData(name) {
	// A category entry.
	var categoryData = {
		name: name,
	};

	// Get a key for a new Category.
  	var newCategoryKey = firebase.database().ref().child('categories').push().key;

  	// Write the new category's data
  	var updates = {};
  	updates['/categories/' + newCategoryKey] = categoryData;

	return firebase.database().ref().update(updates);
}

function writeJokeData(title, content, category) {
	// A joke entry.
	var categoryData = {
		title: title,
		content: content,
		categories: [category]
	};
	// Get a key for a new Joke.
	var newJokeKey = firebase.database().ref().child('jokes').push().key;
	// Write the new joke's data
  	var updates = {};
  	updates['/jokes/' + newJokeKey] = categoryData;

  	return firebase.database().ref().update(updates);
}

// Get a reference to the database service
var database = firebase.database();

function saveCategories() {
	request('http://easyjoke.tk/api/categories', function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	categories = JSON.parse(body).data;
	  	for (item in categories) {
			console.log("Saving category: " + categories[item].name);
			writeCategoryData(categories[item].name);
	  	}
	  }
	})
}

function getJokes(category_id, page) {
	var res = sync_request('GET', 'http://easyjoke.tk/api/categories/4/jokes?page=1');
	return JSON.parse(res.getBody('utf8'));
}

function save_all_jokes_from_category(category) {
	category_jokes = getJokes(4, 1);
	jokes = category_jokes.data;
	count = category_jokes.meta.pagination.count;
	total_pages = category_jokes.meta.pagination.total_pages;
	next_page = category_jokes.meta.pagination.links.next;
	for (item in jokes) {
		joke = jokes[item];
		writeJokeData(joke.title, joke.content, category.key)
	}
}

var categoriesRef = database.ref('categories');
var jokesRef = database.ref('jokes');

categoriesRef.on('child_added', function(data) {
	console.log("Category added: " + data.val() + " " + data.key);
	save_all_jokes_from_category(data)
});

jokesRef.on('child_added', function(data) {
	console.log("Joke added: " + data.val() + " " + data.key);
});

categoriesRef.once('value', function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var categoryKey = childSnapshot.key;
    var categoryData = childSnapshot.val();
    console.log(categoryKey);
    console.log(categoryData);
  });
});



saveCategories();

//category_jokes = getJokes(4, 1);
//count = category_jokes.meta.pagination.count;
//total_pages = category_jokes.meta.pagination.total_pages;
//next_page = category_jokes.meta.pagination.links.next;
//while (next_page) {

//}

//console.log(next_page);
//console.log(total_pages);
//console.log(count);

