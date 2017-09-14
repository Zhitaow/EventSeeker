(function() {

	/**
	 * Variables
	 */
	var user_id = '1111';
	var lng = -122.08;
	var lat = 37.38;

	/**
	 * Initialize
	 */
	function init() {
		// Register event listeners
		$('search-btn').addEventListener('click', loadSearchItems);
		$('search-box').addEventListener('keypress', searchItems);
		$('nearby-btn').addEventListener('click', loadNearbyItems);
		$('fav-btn').addEventListener('click', loadFavoriteItems);
		$('recommend-btn').addEventListener('click', loadRecommendedItems);
		initGeoLocation();
	}

	function initGeoLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(onPositionUpdated,
					onLoadPositionFailed, {
						maximumAge : 60000
					});
			showLoadingMessage('Retrieving your location...');
		} else {
			onLoadPositionFailed();
		}
	}

	function onPositionUpdated(position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;

		loadNearbyItems();
	}

	function onLoadPositionFailed() {
		console.warn('navigator.geolocation is not available');
		getLocationFromIP();
	}

	function getLocationFromIP() {
		// Get location from http://ipinfo.io/json
		var url = 'http://ipinfo.io/json'
		var req = null;
		ajax('GET', url, req, function(res) {
			var result = JSON.parse(res);
			if ('loc' in result) {
				var loc = result.loc.split(',');
				lat = loc[0];
				lng = loc[1];
			} else {
				console.warn('Getting location by IP failed.');
			}
			loadNearbyItems();
		});
	}

	// -----------------------------------
	// Helper Functions
	// -----------------------------------

	/**
	 * A helper function that makes a navigation button active
	 * 
	 * @param btnId -
	 *            The id of the navigation button
	 */
	function activeBtn(btnId) {
		var btns = document.getElementsByClassName('main-nav-btn');

		// deactivate all navigation buttons
		for (var i = 0; i < btns.length; i++) {
			btns[i].className = btns[i].className.replace(/\bactive\b/, '');
		}

		// active the one that has id = btnId
		var btn = $(btnId);
		btn.className += ' active';
	}

	function showLoadingMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
				+ msg + '</p>';
	}

	function showWarningMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> '
				+ msg + '</p>';
	}

	function showErrorMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> '
				+ msg + '</p>';
	}

	/**
	 * A helper function that creates a DOM element <tag options...>
	 * 
	 * @param tag
	 * @param options
	 * @returns
	 */
	function $(tag, options) {
		if (!options) {
			return document.getElementById(tag);
		}

		var element = document.createElement(tag);

		for ( var option in options) {
			if (options.hasOwnProperty(option)) {
				element[option] = options[option];
			}
		}

		return element;
	}

	/**
	 * AJAX helper
	 * 
	 * @param method -
	 *            GET|POST|PUT|DELETE
	 * @param url -
	 *            API end point
	 * @param callback -
	 *            This the successful callback
	 * @param errorHandler -
	 *            This is the failed callback
	 */
	function ajax(method, url, data, callback, errorHandler) {
		var xhr = new XMLHttpRequest();

		xhr.open(method, url, true);

		xhr.onload = function() {
			switch (xhr.status) {
			case 200:
				callback(xhr.responseText);
				break;
			case 403:
				onSessionInvalid();
				break;
			case 401:
				errorHandler();
				break;
			case 500:
				errorHandler();
				break;
			}
		};

		xhr.onerror = function() {
			console.error("The request couldn't be completed.");
			errorHandler();
		};

		if (data === null) {
			xhr.send();
		} else {
			xhr.setRequestHeader("Content-Type",
					"application/json;charset=utf-8");
			xhr.send(data);
		}
	}

	// -------------------------------------
	// AJAX call server-side APIs
	// -------------------------------------

	/**
	 * API #0 Search (or visited) items API end point: [GET]
	 * /Titan/search?user_id=1111&lat=37.38&lon=-122.08
	 */
	function loadSearchItems() {
		activeBtn('search-btn');
		clearItems();
		showOptions(true);
		showSearchBar(true);
	}
	
	function searchItems(){
		var key = event.which || event.keyCode;
		if (key === 13) {
			var addressLat; // ='37.38';
			var addressLng; //='-122.08';
			var option = document.getElementById("search-dist");
			var radius = option.options[option.selectedIndex].value;
			// The request parameters
			var url = './getGeo';
			// var params = 'user_id=' + user_id +'&lat='+lat+'&lon='+lng;
			var address = $('search-box').value;
			var params = 'address=' + address.replace(' ','').replace(',', '+');
			var req = JSON.stringify({});
			console.log(params);
			// display loading message
			showLoadingMessage('Getting geolocation...');
			// make AJAX call: method, url, data, callback, errorHandler
			ajax('GET', url + '?' + params, req, function(res) {
				var items = JSON.parse(res);
				if (!items || items.length === 0) {
					showWarningMessage('No address found.');
				} else {
					console.log("executed");
					console.log(items[0].geometry.location);
					addressLat = items[0].geometry.location.lat;
					addressLng = items[0].geometry.location.lng;
					// The request parameters
					var url = './search';
					// var params = 'user_id=' + user_id +'&lat='+lat+'&lon='+lng;
					var params = 'user_id=' + user_id + '&lat=' + addressLat + '&lon=' + addressLng + '&radius='+ radius;
					var req = JSON.stringify({});
					console.log(params);
					// display loading message
					showLoadingMessage('Searching items...');

					// make AJAX call
					ajax('GET', url + '?' + params, req, function(res) {
						var items = JSON.parse(res);
						console.log("executed" + items);
						if (!items || items.length === 0) {
							showWarningMessage('No search item.');
						} else {
							clearItems();
							showOptions(true);
							showSearchBar(true);
							listItems(items);
						}
					}, function() {
						console.log("Not executed");
						showErrorMessage('Cannot load search items.');
					});

						}
					}, function() {
						// console.log("executed");
						showErrorMessage('Cannot convert address to geolocation.');
					});

			
		} else {
			// console.log("Detect keypress: "+event.keyCode);
		}
	}

	/**
	 * API #1 Load the nearby items API end point: [GET]
	 * /Titan/search?user_id=1111&lat=37.38&lon=-122.08
	 */
	function loadNearbyItems() {
		console.log('loadNearbyItems');
		activeBtn('nearby-btn');
		showOptions(false);
		showSearchBar(false);
		// The request parameters
		var url = './search';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng + '&radius=50';
		var req = JSON.stringify({});
		// display loading message
		showLoadingMessage('Loading nearby items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req,
		// successful callback
		function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No nearby item.');
			} else {
				clearItems();
				listItems(items);
			}
		},
		// failed callback
		function() {
			showErrorMessage('Cannot load nearby items.');
		});
	}

	/**
	 * API #2 Load favorite (or visited) items API end point: [GET]
	 * /Titan/history?user_id=1111
	 */
	function loadFavoriteItems() {
		activeBtn('fav-btn');
		showOptions(false);
		showSearchBar(false);
		// The request parameters
		var url = './history';
		var params = 'user_id=' + user_id;
		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading favorite items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req, function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No favorite item.');
			} else {
				clearItems();
				listItems(items);
			}
		}, function() {
			showErrorMessage('Cannot load favorite items.');
		});
	}

	/**
	 * API #3 Load recommended items API end point: [GET]
	 * /Titan/recommendation?user_id=1111
	 */
	function loadRecommendedItems() {
		activeBtn('recommend-btn');
		showOptions(false);
		showSearchBar(false);
		var option = document.getElementById("search-dist");
		var radius = option.options[option.selectedIndex].value;
		// The request parameters
		var url = './recommendation';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng + '&radius='+radius;

		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading recommended items...');

		// make AJAX call
		ajax(
				'GET',
				url + '?' + params,
				req,
				// successful callback
				function(res) {
					var items = JSON.parse(res);
					if (!items || items.length === 0) {
						showWarningMessage('No recommended item. Make sure you have favorites.');
					} else {
						clearItems();
						listItems(items);
					}
				},
				// failed callback
				function() {
					showErrorMessage('Cannot load recommended items.');
				});
	}

	/**
	 * API #4 Toggle favorite (or visited) items
	 * 
	 * @param item_id -
	 *            The item business id
	 * 
	 * API end point: [POST]/[DELETE] /Dashi/history request json data: {
	 * user_id: 1111, visited: [a_list_of_business_ids] }
	 */
	function changeFavoriteItem(item_id) {
		// Check whether this item has been visited or not
		var li = $('item-' + item_id);
		var favIcon = $('fav-icon-' + item_id);
		var favorite = li.dataset.favorite !== 'true';

		// The request parameters
		var url = './history';
		var req = JSON.stringify({
			user_id : user_id,
			favorite : [ item_id ]
		});
		var method = favorite ? 'POST' : 'DELETE';

		ajax(method, url, req,
		// successful callback
		function(res) {
			var result = JSON.parse(res);
			if (result.result === 'SUCCESS') {
				li.dataset.favorite = favorite;
				favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o';
			}
		});
	}

	// -------------------------------------
	// Create item list
	// -------------------------------------

	/**
	 * List items
	 * 
	 * @param items -
	 *            An array of item JSON objects
	 */
	function clearItems() {
//		$('search-box').type = "hidden";
		var itemList = $('item-list');
		itemList.innerHTML = '';
	}
	function showOptions(isShown) {
		// var myElement = $('search-dist');
		var myElement = document.getElementById('search-dist');
		if (isShown === true) {
			// var myElement = document.getElementById('earringstd');
			myElement.style.visibility = 'visible';
			// myElement.visibility = "visible";
		} else {
			myElement.style.visibility = "hidden";
		}
	}
	function showSearchBar(isShown) {
		myElement = $('search-box');
		if (isShown === true) {
			myElement.type = "text";
			myElement.value = "";
		} else {
			myElement.type = "hidden";
		}
	}

	function listItems(items) {
		// Clear the current results
		var itemList = $('item-list');
		// itemList.innerHTML = '';

		for (var i = 0; i < items.length; i++) {
			addItem(itemList, items[i]);
		}
	}

	/**
	 * Add item to the list
	 * 
	 * @param itemList -
	 *            The
	 *            <ul id="item-list">
	 *            tag
	 * @param item -
	 *            The item data (JSON object)
	 */
	function addItem(itemList, item) {
		var item_id = item.item_id;

		// create the <li> tag and specify the id and class attributes
		var li = $('li', {
			id : 'item-' + item_id,
			className : 'item'
		});

		// set the data attribute
		li.dataset.item_id = item_id;
		li.dataset.favorite = item.favorite;

		// item image
		if (item.image_url) {
			li.appendChild($('img', {
				src : item.image_url
			}));
		} else {
			li.appendChild($('img', {
				src : 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
			}))
		}
		// section
		var section = $('div', {});

		// title
		var title = $('a', {
			href : item.url,
			target : '_blank',
			className : 'item-name'
		});
		title.innerHTML = item.name;
		section.appendChild(title);

		// category
		var category = $('p', {
			className : 'item-category'
		});
		category.innerHTML = 'Category: ' + item.categories.join(', ');
		section.appendChild(category);

		var stars = $('div', {
			className : 'stars'
		});
		
		for (var i = 0; i < item.rating; i++) {
			var star = $('i', {
				className : 'fa fa-star'
			});
			stars.appendChild(star);
		}

		if (('' + item.rating).match(/\.5$/)) {
			stars.appendChild($('i', {
				className : 'fa fa-star-half-o'
			}));
		}

		section.appendChild(stars);

		li.appendChild(section);

		// address
		var address = $('p', {
			className : 'item-address'
		});

		address.innerHTML = item.address.replace(/\"/g,
				'')+', ' + item.city + '<br/>';
		li.appendChild(address);

		var date = $('p', {
			className : 'item-date'
		});
		if (typeof item.start_date !== 'undefined') {
			if (typeof item.end_date !== 'undefined') {
				date.innerHTML = 'From <br/>'+item.start_date+'<br/> to <br/>'+item.end_date;
			} else {
				date.innerHTML = item.start_date;
			}
		}
		li.appendChild(date);

		// favorite link
		var favLink = $('p', {
			className : 'fav-link'
		});

		favLink.onclick = function() {
			changeFavoriteItem(item_id);
		};

		favLink.appendChild($('i', {
			id : 'fav-icon-' + item_id,
			className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'
		}));

		li.appendChild(favLink);

		itemList.appendChild(li);
	}

	init();

})();

$("#item-nav").scroll(function() {
    HandlingScrollingStuff();
}); 

// fix sidebar on scroll
var elementPosition = $('#item-nav').offset();
$(window).scroll(function(){
        if($(window).scrollTop() >= elementPosition.top){
              $('#item-nav').css('position','fixed').css('top','0').css('margin-top','60px');
              $('#top-link-block').css('width','80').css('height','80');
        } else {
            $('#item-nav').css('position','static').css('top','0').css('margin-top','0');
            $('#top-link-block').css('width','0').css('height','0');
        }    
});
// END