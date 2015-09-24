// TO DO:
// Close InfoWindow on search - not working
// Style Project

// calls panelSnap.js and sets up snap functions
var options = {
	$menu: false,
	menuSelector: 'a',
	panelSelector: '> section',
	namespace: '.panelSnap',
	onSnapStart: function(){},
	onSnapFinish: function(){},
	onActivate: function(){},
	directionThreshold: 5,
	slideSpeed: 300,
	delay: 0,
	easing: 'linear',
	offset: 0,
	navigation: {
		keys: {
			nextKey: 40,
			prevKey: 38,
		},
		buttons: {
			$nextButton: false,
			$prevButton: false,
		},
		wrapAround: false
	}
};

$('body').panelSnap(options);

$('#hero-btn').on('click', function() {
      $('body').panelSnap('snapTo', 'next');
});

$('#global-search-about').keypress(function(event) {
	if (event.keyCode == 13){
		$('body').panelSnap('snapTo', 'next');
	}
});

// calls scrollit.js
// $(function(){
//   $.scrollIt({
//   	upKey: 38,
//   	downKey:40
//   });
// });

// Toggles Crawl List
$("#menu-toggle").click(function(e) {
	e.preventDefault();
	$("#wrapper").toggleClass("toggled");
});

var map, marker, bounds, directionsService, directionsDisplay;
var infoWindow = new google.maps.InfoWindow();
//var directionsService = new google.maps.DirectionsService();
//var directionsDisplay = new google.maps.DirectionsRenderer({});

var CLIENT_ID = 'Q0A4REVEI2V22KG4IS14LYKMMSRQTVSC2R54Y3DQSMN1ZRHZ';
var CLIENT_SECRET = 'NPWADVEQHB54FWUKETIZQJB5M2CRTPGRTSRICLZEQDYMI2JI';
var BAR_ID = '4bf58dd8d48988d116941735';
var PUB_ID = '4bf58dd8d48988d11b941735';
var BREWERY_ID = '50327c8591d4c4b30a586d5d';
var DIVEBAR_ID = '4bf58dd8d48988d118941735'; // currently unused

//make a Location, data to be used for markers and list view
var Location = function(data){
	var self = this;
	this.name = ko.observable(data.name);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.address = ko.observable(data.address);
	this.rating = ko.observable(data.rating);
	this.marker = ko.observableArray(data.marker);

	this.contentString = // create content string for infoWindow
		'<div id="content">'+
		'<div id="siteNotice">'+
		'</div>'+
		'<h1 id="firstHeading" class="firstHeading">'+ self.name() +'</h1>'+
		'<div id="bodyContent">'+
		'<p><b>Address and Rating</b></p>'+
		'<p>'+ self.address() + ', Rating: '+ self.rating() + '</p>' +
		'</div>'+
		'</div>';
};

// function to initialize Google map
function initMap() {
	bounds = new google.maps.LatLngBounds();
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 49.2844, lng: -123.1089},
		disableDefaultUI: true
	});

	var styles =[
		{
			"elementType": "labels",
			"stylers": [
				{
					"visibility": "on"
				}
			]
		},
		{
			"elementType": "labels.text.stroke",
			"stylers": [
				{
					"visibility": "off"
				},
				{
					"color": "#ffffff"
				},
				{
					"lightness": 16
				}
			]
		},
		{
			"elementType": "labels.text.fill",
			"stylers": [
				{
					"saturation": 36
				},
				{
					"color": "#333333"
				},
				{
					"lightness": 40
				}
			]
		},
		{
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "road",
			"elementType": "geometry",
			"stylers": [
				{
					"visibility": "on"
				},
				{
					"color": "#000000"
				},
				{
					"weight": 0.2
				}
			]
		},
		{
			"featureType": "landscape",
			"stylers": [
				{
					"color": "#ffffff"
				},
				{
					"visibility": "on"
				}
			]
		},
		{
			"featureType": "water",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#e9e9e9"
				},
				{
					"lightness": 17
				}
			]
		},
		{
			"featureType": "poi",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#f5f5f5"
				},
				{
					"lightness": 21
				}
			]
		},
		{
			"featureType": "poi.park",
			"elementType": "geometry",
			"stylers": [
				{
					"color": "#dedede"
				},
				{
					"lightness": 21
				}
			]
		},
		{
			"featureType": "administrative",
			"stylers": [
				{
					"visibility": "off"
				}
			]
		}
		];

	var styledMap = new google.maps.StyledMapType(styles,
    	{name: "Styled Map"});

	google.maps.event.addDomListener(window, "resize", function() {	// browser resize triggers map resize for responsiveness
		var center = map.getCenter();
		google.maps.event.trigger(map, "resize");
		map.setCenter(center);
	});

	// adds search bars and list view onto map, sets styled map
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('menu-toggle'));
	map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(document.getElementById('list'));
	map.mapTypes.set('map_style', styledMap);
	map.setMapTypeId('map_style');
}

function viewModel(){
	var self = this;
	this.locationsList = ko.observableArray(); // list to keep track of Locations
	this.markers = ko.observableArray(); // list of markers
	this.crawlList = ko.observableArray(); // list of user selected venues
	this.filter = ko.observable(''); 	// the filter for search bar
	this.isLocked= ko.observable(false);
	this.locInput = ko.observable('Vancouver, BC');  // user defined location input

	this.loadLocations = function(location){ // takes a user defined location; Vancouver, BC to start with
		$.ajax({
			url: 'https://api.foursquare.com/v2/venues/explore?',
			dataType: 'json',
			data: 'limit=30&near=' + location +
				'&categoryId=' + BAR_ID +
				',' + PUB_ID +
				',' + BREWERY_ID +
				'&client_id=' + CLIENT_ID +
				'&client_secret=' + CLIENT_SECRET +
				'&v=20150806&m=foursquare',
			success: function(fsData){
				var response = fsData.response.groups[0].items;
				self.clearData(); // makes sure crawl List and directions display is emptied out on new location search
				self.emptyRoute(directionsDisplay);
				self.createLocations(response);
				map.setCenter({lat: self.locationsList()[15].lat(), lng: self.locationsList()[12].lng()}); // hacky way of getting map to re-center
				map.setZoom(13);
			},
			error: function(error){
				alert('There was a problem retrieving the requested data, please double check your query');
			}
		});
	};

	this.searchLocations = ko.computed(function(){ // not sure if i'm using this right.."undefined is logged"
		var location = self.locInput().toLowerCase();
		self.loadLocations(location);
	});

	this.createLocations = function(response){
		for (var i = 0; i < response.length; i++) {
			var venue = response[i].venue;
			var venueName = venue.name;
			var venueLoc = venue.location;
			var venueRating = venue.rating;
			var obj = {
				name: venueName,
				lat: venueLoc.lat,
				lng: venueLoc.lng,
				address: venueLoc.address,
				rating: venueRating
			};
			self.locationsList.push(new Location(obj));
			self.makeMarkers();
		}
	};

	this.clearData = function(){ //clears map data on new location search
		self.markers().forEach(function(marker){
			marker.setMap(null);
		});
		self.locationsList.removeAll();
	};

	this.makeMarkers = function(){
		// for each Location plant a marker at the given lat,lng and on click show the info window
		self.locationsList().forEach(function(place){
			var myLatLng = new google.maps.LatLng(place.lat(), place.lng());
			marker = new google.maps.Marker({
				position: myLatLng,
				map: map,
				title: place.name()
			});
			bounds.extend(myLatLng); // extends map bounds to make markers fit on map
			place.marker = marker; // makes a marker property for each Location object in self.locationsList()
			self.markers.push(place.marker); // pushes a marker into the array of markers to be tracked on search

			// google.maps.event.addListener(marker, 'click', function() {
			// 	var self = this;
			// 	self.setAnimation(google.maps.Animation.BOUNCE);
			// 	setTimeout(function(){self.setAnimation(null); }, 750);
			// });


			google.maps.event.addListener(marker, 'click', (function(marker, place) {
				return function() {
					var self = this;
					// place.marker.setAnimation(google.maps.Animation.BOUNCE);
					// setTimeout(function(){place.marker.setAnimation(null); }, 1400);
					infoWindow.setContent(place.contentString);
					infoWindow.open(map, marker);
					self.setAnimation(google.maps.Animation.BOUNCE);
					setTimeout(function(){self.setAnimation(null); }, 750);
				};
			})(marker, place));
			map.fitBounds(bounds);
		});
	};

	this.openFromList = function(place){ // takes in the relevant Location Object
		var listItem = place.name(); // pulls the Location name from clicked list item
		var len = self.markers().length;
		for (var i = 0; i < len; i++){
			if (listItem === self.markers()[i].title){ // If the clicked list item's name matches a relevant marker, then we display the infoWindow
				var currentMarker = self.markers()[i];
				map.panTo(currentMarker.position); // pans to marker
				map.setZoom(14);
				infoWindow.setContent(place.contentString);
				infoWindow.open(map, currentMarker);
			}
		}
	};

	this.addToRoute = function(place){ // takes in a location object and adds it to crawlList so user can create a route
		if (!($.inArray(place, self.crawlList()) > -1)){  // checks for duplicate locations
			self.crawlList.push(place);
		} else {
			alert('duplicate');
		}
	};

	this.removeFromRoute = function(place){ // removes location from list
		if ($.inArray(place, self.crawlList()) > -1){  // checks for duplicate locations
			self.crawlList.remove(place);
		} else {
			alert('Nothing to Remove');
		}
	};

	this.calculateAndDisplayRoute = function(directionsService, directionsDisplay){
		window.directionsService = new google.maps.DirectionsService();
		window.directionsDisplay = new google.maps.DirectionsRenderer({polylineOptions: { strokeColor: '#5cb85c' }});

		var waypoints = [];
		for (var i = 0; i < self.crawlList().length; i++){
			var venueLat = self.crawlList()[i].lat();
			var venueLng = self.crawlList()[i].lng();
			waypoints.push({
				location: {lat: venueLat, lng: venueLng},
				stopover: true
			});
		}

		window.directionsService.route({
			origin: waypoints[0].location,// sets origin as first way point, this is causing the directions panel bug
			destination: waypoints[waypoints.length - 1].location, // set last waypoint as destination, causing duplicate location on directions panel
			waypoints: waypoints.slice(1, waypoints.length -1),
			optimizeWaypoints: false,
			//provideRouteAlternatives: true,
			travelMode: google.maps.TravelMode.WALKING
		}, function(response, status){
			if (status === google.maps.DirectionsStatus.OK){
				window.directionsDisplay.setDirections(response);
				var route = response.routes[0];
				console.log(response);
			} else {
				alert('Directions request failed due to ' + status);
			}
		});

		window.directionsDisplay.setMap(map);
		window.directionsDisplay.setPanel(document.getElementById('directions-panel'));
	};

	this.makeRoute = function(directionsService, directionsDisplay){
		if (self.crawlList().length > 1 && self.crawlList().length < 8){
			self.calculateAndDisplayRoute(directionsService, directionsDisplay);
			self.markers().forEach(function(marker){
				marker.setMap(null);
			});
			self.isLocked(true);
		} else {
			alert('You need atleast two locations and are limited to 8');
		}
	};

	this.emptyRoute = function(directionsDisplay){ //remakes markers, removes last crawlList
		self.crawlList.removeAll();
		self.makeMarkers();
		if (directionsDisplay != null){
			window.directionsDisplay.setMap(null);
			window.directionsDisplay.setPanel(null);
			self.isLocked(false);
		}
	};

	this.setMarker = function(){ // for each marker in the list set it to be visible
		for (var i = 0; i < self.markers().length; i++){
			self.markers()[i].setVisible(true);
		}
	};

	// filters out list and markers
	this.searchFilter = ko.computed(function(){
		var filter = self.filter().toLowerCase();
		if (!filter){ // if false return the list as normal
			self.setMarker();
			infoWindow.close();
			return self.locationsList();
		} else {
			return ko.utils.arrayFilter(self.locationsList(), function(place){
				for (var i = 0; i < self.markers().length; i++){ // for every marker if the title of the marker matches the filter set markers to visible
					if (self.markers()[i].title.toLowerCase().indexOf(filter) !== -1){
						self.markers()[i].setVisible(true);
					} else { // everything else, set it to false
						self.markers()[i].setVisible(false);
					}
				}
				return place.name().toLowerCase().indexOf(filter) !== -1; // returns matched list names
			});
		}
	});
}
// initialize the map
initMap();
// bind KO
var viewModel = new viewModel();
ko.applyBindings(viewModel);