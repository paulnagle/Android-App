// Dont forget to comment all of this
var map = null;
var myLatLng = new L.latLng(53.341318, -6.270205); // Irish Service Office
var circle = null;
var currentLocationMarker = null;
var searchRadius = 25;  // default to 25km
var days;
var isMapSpinning = false;
var hasSearchChanged = "true"; // We only want to run a new search if the search settings have changed.
var markerClusterer = null; 
// Store these in an array that we can save the state of?
var searchSun = 1;
var searchMon = 1;
var searchTue = 1;
var searchWed = 1;
var searchThu = 1;
var searchFri = 1;
var searchSat = 1;

var opts = {
    className: 'spinnerDiv', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '25%', // Top position relative to parent in px
    left: '50%' // Left position relative to parent in px
};

var spinner = new Spinner(opts);

// Extend the Default marker class
// Each one of these markers on the map represents a meeting
var NaIcon = L.Icon.Default.extend({
	options: {
		iconUrl: 'img/marker-icon-red.png' // photoshop this image to add an approximation of the NA symbol
	}
});
var naIcon = new NaIcon();

// https://www.mapbox.com/maki/
// There should only be one of these markers on the map, representing where the meeting search
// is centered.
var markerIcon = L.MakiMarkers.icon({
	icon: "marker",
	color: "#0a0",
	size: "l"
});

// This function cleans up and deletes any old Maps
function deleteMap() {
	console.log("****Running deleteMap()***");
	if (circle) {
		delete circle;
	}

	if (currentLocationMarker) {
		delete currentLocationMarker;
	}
	
	// Remove the markerClusterer layer from the map
	if (markerClusterer) {
		map.removeLayer(markerClusterer);	
	}
	
	if (map) {
	console.log("****Running map.remove()***");
		delete map;	
		map.remove();
	}
	
	// This should stop any spurious spinning!
	if (isMapSpinning) {
		spinMap(false);
	}
	
	// now delete the old Map container
	var oldMapContainer = document.getElementById("map_canvas");
	var mapContainerParent = oldMapContainer.parentNode;
	mapContainerParent.removeChild(oldMapContainer);

	// recreate this <div id="map_canvas" style="width: 100%"></div>
	var newMapContainer = document.createElement('div');
	newMapContainer.setAttribute("id", "map_canvas");
	newMapContainer.style.cssText = 'width: 100%';
	mapContainerParent.appendChild(newMapContainer);
	// Set the height of the map.. 
	var topBarHeight = document.getElementById('topBar').clientHeight;
	var tabBarHeight = document.getElementById('tabBar').clientHeight;
	var newHeight = window.innerHeight - ( topBarHeight + tabBarHeight);
	document.getElementById("map_canvas").style.height = newHeight + "px";	
	console.log("=========Map div height = " + newHeight + "px ==========");
	
	}

function initMap() {
	console.log("****Running initMap()***");

	map = L.map('map_canvas');
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

	console.log("****map.setView****" + myLatLng);		
	map.setView(myLatLng, 9);
	
}

// This function creates a new map, adds the Circle, the current location marker and
// then runs a new search.
function newMap() {
	console.log("****Running newMap()***");
	

	
	deleteMap();

	map = L.map('map_canvas'); // 
		
	map.on('load', function(e) {  
		console.log("****map load event****");

		circle = L.circle(myLatLng, searchRadius * 1000, {fillOpacity: 0.1});
		circle.addTo(map);
		var circleBounds = new L.LatLngBounds;
		circleBounds = circle.getBounds();
		map.fitBounds(circleBounds);  		
	
		currentLocationMarker = new L.marker(myLatLng, {draggable: true, icon: markerIcon}).addTo(map);
		currentLocationMarker.bindPopup("This is where you are searching from. Drag this marker to search in another location");
		currentLocationMarker.on('dragend', function(e){
			myLatLng = e.target.getLatLng();
			hasSearchChanged = "true";
			newMap();
		}); 
		runSearch(days);
	});
		
	console.log("****Adding tile Layer to Map****");	
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

	console.log("****map.setView****" + myLatLng);		
	map.setView(myLatLng, 9);
}

// This function reads the address in the locTextBox and does a geocode search for that location
// When the location is found, the function renderGeocode is called
function findAddress() {
	require(["dijit/registry"], 
	function(registry){
		var widget = registry.byId(locTextBox);
		var target = registry.byId(locSpin);
		spinner.spin(target);
		document.getElementById('settingsUL').style.opacity=".3";
		geocodeLocation = widget.value;
		// Using my personal key here!
		var geoCodeURL = 'http://open.mapquestapi.com/geocoding/v1/address?key=Fmjtd%7Cluur25ubn0%2Crw%3Do5-9w751f&location=' 
		geoCodeURL += geocodeLocation;
		geoCodeURL +=', Ireland&callback=renderGeocode';
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = geoCodeURL;
		document.body.appendChild(script);
	});
};

// This function is called from findAddress when the search for the location is complete.
// If the search was sucessful, the newMap() function is called with the new location
function renderGeocode(response) {
    var html = '';  
	var geoCodeResult = response.results[0].locations[0];	

	if (geoCodeResult) {
		var d = new Date(); 
		hours = d.getHours(); 
		hours = hours < 10 ? '0'+hours : hours;
		minutes = d.getMinutes();  
		minutes = minutes < 10 ? '0'+minutes : minutes;
		seconds = d.getSeconds(); 
		seconds = seconds < 10 ? '0'+seconds : seconds;
		document.getElementById("geoLocationLegend").innerHTML = "Location updated at " + hours + ":" + minutes + ":" + seconds;	
		myLatLng = L.latLng(geoCodeResult.latLng.lat, geoCodeResult.latLng.lng);
		hasSearchChanged = "true";
	} else {
		document.getElementById("geoLocationLegend").innerHTML = "Location not found!";	
	}
	
	spinner.stop();
	document.getElementById('settingsUL').style.opacity="1";
}

// This function converts a number to a day of the week	
function dayOfWeekAsString(dayIndex) {
	return ["not a day?", "Sun", "Mon","Tue","Wed","Thu","Fri","Sat"][dayIndex];
}

// This function either starts the AJAX spinner on the map, or stops it.. depending on the flag passed
function spinMap(spinFlag) {	
	if (spinFlag == true ) {
		map.spin(true);
		isMapSpinning = true;
		if (currentLocationMarker) {
			currentLocationMarker.setOpacity(0);
		}
	} else {
		map.spin(false);
		isMapSpinning = false;
		if (currentLocationMarker) {
			currentLocationMarker.setOpacity(1);
		}
	}
}	

// This function uses the browser function to find our current GPS location. If the location
// is found OK, the newMap() function is called with the location.
function getCurrentGPSLocation() {
    console.log("****getCurrentGPSLocation()****");
	navigator.geolocation.getCurrentPosition(setLocation, noLocation);
	document.getElementById("locResult").innerHTML = ".";
	var target = document.getElementById("gpsSpin");
	spinner.spin(target);
	document.getElementById('settingsUL').style.opacity=".3";
	
	function setLocation(location) {
	    console.log("****GPS location found");
		var d = new Date(); 
		hours = d.getHours(); 
		hours = hours < 10 ? '0'+hours : hours;
		minutes = d.getMinutes();  
		minutes = minutes < 10 ? '0'+minutes : minutes;
		seconds = d.getSeconds(); 
		seconds = seconds < 10 ? '0'+seconds : seconds;
		document.getElementById("locResult").innerHTML = "Location updated at " + hours + ":" + minutes + ":" + seconds;
		spinner.stop();
		document.getElementById('settingsUL').style.opacity="1";

		myLatLng = L.latLng(location.coords.latitude, location.coords.longitude);
		hasSearchChanged = "true";
//		newMap();
	}
	
	function noLocation() {
	    console.log("****GPS location NOT found");
		document.getElementById("locResult").innerHTML = "Location not found";
		spinner.stop();
		document.getElementById('settingsUL').style.opacity="1";	
	}
}

// This function generates the URL to query the BMLT based on the settings in the Settings Panel
function buildSearchURL () {
	console.log("****Running buildSearchURL()****");	
	search_url = "http://www.nasouth.ie/bmlt/main_server/client_interface/json/";
	search_url += "?switcher=GetSearchResults";
	search_url += "&geo_width_km=" + searchRadius;
	search_url += "&long_val=" + myLatLng.lng;
	search_url += "&lat_val=" + myLatLng.lat;
	search_url += "&sort_key=sort_results_by_distance";
	if (searchSun == true) { search_url += "&weekdays[]=1"; }
	if (searchMon == true) { search_url += "&weekdays[]=2"; }
	if (searchTue == true) { search_url += "&weekdays[]=3"; }
	if (searchWed == true) { search_url += "&weekdays[]=4"; }
	if (searchThu == true) { search_url += "&weekdays[]=5"; }
	if (searchFri == true) { search_url += "&weekdays[]=6"; }
	if (searchSat == true) { search_url += "&weekdays[]=7"; }
	search_url += "&data_field_key=meeting_name,weekday_tinyint,start_time,location_text,location_street,location_info,distance_in_km,latitude,longitude";	
	console.log("====SEARCH URL====" + search_url);
}

// This function sets the days of the week that we want to search, based on the button the user has clicked
// on the app.
function setupSwitches(day) {
	console.log("****Running setupSwitches()****");
	require(["dijit/registry"], 
	function(registry){
		var switches = ["sw_mon", "sw_tue", "sw_wed", "sw_thu", "sw_fri", "sw_sat", "sw_sun"];
		if (day != "all") { //reset all the day switches to off
			for (i = 0; i < switches.length; i++) {
				var widget = registry.byId(switches[i]);
				widget.set("value", "off"); // "on" or "off" can be set
			}
			var d = new Date();
			var n = d.getDay();
			
			// Just switch on today's switch
			if (day == "today") {
				if (n == 7) { // It's Sunday
					n = 0;
				}
				console.log("Enable sw_" + dayOfWeekAsString(n+1).toLowerCase());
				search_day = "sw_" +  dayOfWeekAsString(n+1).toLowerCase();
			} else {
				if (day == "tomorrow") { // Just switch on tomorrow's switch
					if (n >= 6) {  // It's Saturday
						n = n-7;
					}
					console.log("Enable sw_" + dayOfWeekAsString(n+2).toLowerCase());
					search_day = "sw_" +  dayOfWeekAsString(n+2).toLowerCase();
				}
			}
			var widget = registry.byId(search_day);
			widget.set("value", "on"); // "on" or "off" can be set
		} else {
			for (i = 0; i < switches.length; i++) {
				var widget = registry.byId(switches[i]);
				widget.set("value", "on"); // "on" or "off" can be set
			}
		}
	});
}

// This function runs the query to the BMLT and displays the results on the map
function runSearch(day) {
	require([
		"dojo/json", 
		"dojo/dom", 
		"dojo/dom-construct",  
		"dojox/mobile/RoundRectList",
		"dojox/mobile/ListItem",
		"dojo/_base/xhr",
		"dijit/registry"], 
	function(JSON, dom, domConstruct, RoundRectList, ListItem, xhr, registry){
		console.log("****Running runSearch()****");
		
		setupSwitches(day);				
		buildSearchURL();
		
		// Destroy and recreate the holder for list results
		domConstruct.empty("output");
		var ul  = new RoundRectList({}, domConstruct.create("ul",{}, this.output) );
		ul.startup();
		console.log("******Spin map TRUE at the start of runSearch**");
		spinMap(true);

		var xhrArgs = {
	        url: search_url,
			handleAs:"json",
			timeout: 10000,
			error: function(e){
				spinMap(false);
				alert("Search error! This app relies on your internet connection. Press the Map button to try again. [" + e + "]");
				},
			load: function(data){				
				var i = 0;
				if (markerClusterer) {
					delete markerClusterer;
				}
				markerClusterer = new L.markerClusterGroup({showCoverageOnHover: false, 
																removeOutsideVisibleBounds: false});
				dojo.forEach(data, function(datum) { 
					i++;					
					markerContent = "<p><b>" + datum.meeting_name + "</b></p>";
					markerContent += "<p><i>" + dayOfWeekAsString(datum.weekday_tinyint) 
					markerContent += "&nbsp;" + datum.start_time.substring(0, 5) + "</i>&nbsp;&nbsp;";
					markerContent += datum.location_text + "&nbsp;" + datum.location_street + "<br>";
					markerContent += "<i>" + datum.location_info + "</i></p>";
					fromHere = "'" + myLatLng.lat + ',' + myLatLng.lng + "'";
					toHere   = "'" + datum.latitude + ',' + datum.longitude + "'";
				 	markerContent += '<a href="http://maps.google.com/maps?saddr=';
					markerContent += myLatLng.lat + ',' + myLatLng.lng;
					markerContent += '&daddr=' 
					markerContent += datum.latitude + ',' + datum.longitude;
					markerContent +='">Directions</a>';
					
					li = new ListItem({
						"label"          : markerContent,
						"variableHeight" : "true",
						"class"          : "subTotalListItem",
						"rightText"      : parseFloat(datum.distance_in_km).toFixed(1) + " kms"
					}, domConstruct.create("li",{}, ul.domNode) );
					li.startup();								   
					
					// Add markers to the markerClusterer Layer
					var aMarker = L.marker([datum.latitude, datum.longitude], {icon: naIcon});
					aMarker.bindPopup(markerContent);
					markerClusterer.addLayer(aMarker);
				});	
				console.log("******Spin map FALSE end of dojo ajax**");
				spinMap(false);
				// Add the markerClusterer layer to the map
				map.addLayer(markerClusterer);	
				document.getElementById("list_heading").innerHTML= '<h3 align="center">' + i + '&nbsp;Meetings</h3>';
				registry.byId("tab-list").set('badge', i);
				hasSearchChanged = "false"; 
			}
		}
		var deferred = dojo.xhrGet(xhrArgs);
	});	
}

// This function sets the correct TAB along the bottom of the screen to be highlighted
function selectTab(tabname){
	require(["dijit/registry"], 
	function(registry){
		if (tabname === "tab-search") {
			registry.byId("tab-search").set('selected', true);
			registry.byId("tab-list").set('selected', false);
			registry.byId("tab-setting").set('selected', false);
		} else if (tabname === "tab-list") {
			registry.byId("tab-search").set('selected', false);
			registry.byId("tab-list").set('selected', true);
			registry.byId("tab-setting").set('selected', false);		
		} else if (tabname === "tab-settings") {
			registry.byId("tab-search").set('selected', false);
			registry.byId("tab-list").set('selected', false);
			registry.byId("tab-setting").set('selected', true);		
		}
	});
}

// This is run when the page is initially loaded and ready	
// Main purpose is to build the settings panel, and the
// search results pane;	
require([	
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/ready",
	"dojox/mobile/parser",
	"dojox/mobile",
	"dojox/mobile/FormLayout",
	"dojox/mobile/ScrollableView",
	"dojox/mobile/Slider",
	"dojox/mobile/Switch",
	"dijit/registry",
	"dojox/mobile/TextArea",
	"dojox/mobile/TabBar",
	"dojox/mobile/Button",
	"dojo/domReady!"] ,
function(	dom, domConstruct, on, ready, parser, mobile, FormLayout, ScrollableView, 
			Slider, Switch, registry, TextArea,TabBar, Button) {
	console.log("****Running initial LOADER****");
	var myButton = new Button({
		label: "Locate",
		onClick: function(){
			getCurrentGPSLocation();
		}
	}, "locResetBtn").startup();
	
	// Build the settings panel
	var slid  = new Slider({
		"value"	:	25 ,
		"min"	:	1 ,
		"max"	:	150,
		"step"	:	1 ,
		"type"	:	"range", 
		"intermediateChanges" : true,
		"style"	:	"width:90%;",
		"onChange" : function(newValue){ 
			hasSearchChanged = "true";		
			searchRadius =  newValue; 
			document.getElementById('radiusLabel').innerHTML= "&nbsp;Search radius =&nbsp;" + searchRadius + "&nbsp;kms";	
		}
	}, domConstruct.create("slid",{}, this.sliderHere));
	
	slid.startup();
					
	var sw_sun = new Switch({id:"sw_sun", value:"on", leftLabel:"Sun"});
	sw_sun.placeAt(this.SunSwitchHere); 
	sw_sun.startup();
	var sw_sun_listen = registry.byId("sw_sun");
	sw_sun_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchSun = -1;
		} else {
			searchSun = 1; 
		}
	});
				
	var sw_mon = new Switch({id:"sw_mon", value:"on", leftLabel:"Mon"});
	sw_mon.placeAt(this.MonSwitchHere); 
	sw_mon.startup();
	var sw_mon_listen = registry.byId("sw_mon");
	sw_mon_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchMon = -1;
		} else {
			searchMon = 1; 
		}
	});

	var sw_tue = new Switch({id:"sw_tue", value:"on", leftLabel:"Tue"});
	sw_tue.placeAt(this.TueSwitchHere); 
	sw_tue.startup();
	var sw_tue_listen = registry.byId("sw_tue");
	sw_tue_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchTue = -1;
		} else {
			searchTue = 1; 
		}
	});

	var sw_wed = new Switch({id:"sw_wed", value:"on", leftLabel:"Wed"});
	sw_wed.placeAt(this.WedSwitchHere); 
	sw_wed.startup();
	var sw_wed_listen = registry.byId("sw_wed");
	sw_wed_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchWed = -1;
		} else {
			searchWed = 1; 
		}
	});

	var sw_thu = new Switch({id:"sw_thu", value:"on", leftLabel:"Thu"});
	sw_thu.placeAt(this.ThuSwitchHere); 
	sw_thu.startup();
	var sw_thu_listen = registry.byId("sw_thu");
	sw_thu_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchThu = -1;
		} else {
			searchThu = 1; 
		}
	});
					
	var sw_fri = new Switch({id:"sw_fri", value:"on", leftLabel:"Fri"});
	sw_fri.placeAt(this.FriSwitchHere); 
	sw_fri.startup();
	var sw_fri_listen = registry.byId("sw_fri");
	sw_fri_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchFri = -1;
		} else {
			searchFri = 1; 
		}
	});
					
	var sw_sat = new Switch({id:"sw_sat", value:"on", leftLabel:"Sat"});
	sw_sat.placeAt(this.SatSwitchHere); 
	sw_sat.startup();					
	var sw_sat_listen = registry.byId("sw_sat");
	sw_sat_listen.on("stateChanged", function(newState){
		hasSearchChanged = "true";
		if (newState == "off") {
			searchSat = -1;
		} else {
			searchSat = 1; 
		}
	});			
	
	dojo.query('#search_all').onclick( function(evt){
		console.log("****search_all onclick event****");
		selectTab("tab-search"); 
		days = "all";
		if (hasSearchChanged == "true" ) {
			newMap();
		}
	});
	
	dojo.query('#search_today').onclick( function(evt){
		console.log("****search_today onclick event****");	
		days = "today";
		selectTab("tab-search"); 
		if (hasSearchChanged == "true" ) {		
			newMap();
		}
	});
	
	dojo.query('#search_tomorrow').onclick( function(evt){
		console.log("****search_tomorrow onclick event****");
		days = "tomorrow";
		selectTab("tab-search"); 
		if (hasSearchChanged == "true" ) {
			newMap();
		}
	});
	
	dojo.query('#search_settings').onclick( function(evt){
		console.log("****search_settings onclick event****");
		selectTab("tab-settings");
	});
	
	dojo.query('#tab-search').onfocus( function(evt){
		console.log("****tab-search onFocus event****" + hasSearchChanged);
		selectTab("tab-search"); 
		if (hasSearchChanged == "true" ) {
			newMap();
		}
	});
	
	dojo.query('#tab-list').onfocus( function(evt){ 
		console.log("****tab-list onFocus event****");	
		selectTab("tab-list");
	});
	
	dojo.query('#tab-setting').onfocus( function(evt){ 
		console.log("****tab-setting onFocus event****");	
		selectTab("tab-setting");
	});
	

	// Initialise the map
	initMap();
});			

