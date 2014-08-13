// Dont forget to comment all of this

var map = null;
var myLatLng = new L.latLng();
var circle = null;
var currentLocationMarker = null;
var markerClusterer = new L.markerClusterGroup();
var aMarker = null;
var searchRadius = 10;  // default to 10km
var searchSun = 1;
var searchMon = 1;
var searchTue = 1;
var searchWed = 1;
var searchThu = 1;
var searchFri = 1;
var searchSat = 1;

//Extend the Default marker class
var NaIcon = L.Icon.Default.extend({
	options: {
		iconUrl: 'img/marker-icon-red.png' 
	}
});
var naIcon = new NaIcon();

// https://www.mapbox.com/maki/
var markerIcon = L.MakiMarkers.icon({
	icon: "marker",
	color: "#0a0",
	size: "l"
});
		
function dayOfWeekAsString(dayIndex) {
	return ["not a day?", "Sun", "Mon","Tue","Wed","Thu","Fri","Sat"][dayIndex];
}

function spinMap(spinFlag) {	
	if (spinFlag == true ) {
		console.log("****spinning map => " + spinFlag);
		map.spin(true);
		currentLocationMarker.setOpacity(0);
	} else {
		console.log("****spinning map => " + spinFlag);
		map.spin(false);
		currentLocationMarker.setOpacity(1);
	}
}	

function initMap () {
	console.log("****Running initMap()***");
	var mapNode = document.getElementById("map_canvas");
	var newHeight = Math.round((70 / 100) * window.innerHeight);
	mapNode.style.height = newHeight + "px";			

	myLatLng = L.latLng(51.9, -8.6);

	console.log("****creating map****");
	map = L.map('map_canvas').setView(myLatLng, 9);

	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
		minZoom 	:	 6,
		maxZoom		: 	18
	}).addTo(map);
	
	function onLocationFound(e) {
		console.log("****Running onLocationFound()***");
		currentLocationMarker = new L.marker(e.latlng, {draggable: true, icon: markerIcon}).addTo(map);

		currentLocationMarker.on('dragend', function(e){
			myLatLng = e.target.getLatLng();
			refreshMap("all");
		});
		
		if (circle) {
			map.removeLayer(circle);
		}
		circle = L.circle(e.latlng, searchRadius * 1000);
		map.addLayer(circle);
		myLatLng = e.latlng;
	}

	function onLocationError(e) {
	    console.log("****onLocationError()****");	
		currentLocationMarker = new L.marker(myLatLng, {draggable: true, icon: markerIcon}).addTo(map);

		currentLocationMarker.on('dragend', function(e){
			myLatLng = e.target.getLatLng();
			refreshMap("all");
		});
		
		if (circle) {
			map.removeLayer(circle);
		}
		circle = L.circle(myLatLng, searchRadius * 1000);
		map.addLayer(circle);
	}

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	map.locate({setView: true});
}

function refreshMap(day) {
	console.log("****Running refreshMap()****");
	spinMap(true);
	if (circle) {
		map.removeLayer(circle);
	}
	circle = L.circle(myLatLng, searchRadius * 1000);
	map.addLayer(circle);
	runSearch(day);
}

function getCurrentGPSLocation() {
    console.log("****getCurrentGPSLocation()****");
	navigator.geolocation.getCurrentPosition(GetLocation);
	document.getElementById("locResult").innerHTML = ".";
	function GetLocation(location) {
		var d = new Date(); 
		hours = d.getHours(); 
		hours = hours < 10 ? '0'+hours : hours;
		minutes = d.getMinutes();  
		minutes = minutes < 10 ? '0'+minutes : minutes;
		seconds = d.getSeconds(); 
		seconds = seconds < 10 ? '0'+seconds : seconds;
		myLatLng = L.latLng(location.coords.latitude, location.coords.longitude);
		document.getElementById("locResult").innerHTML = "Location updated at " + hours + ":" + minutes + ":" + seconds;
		currentLocationMarker.setLatLng(myLatLng);
		refreshMap("all");
	}
}

function runSearch (day) {
	require([
		"dojo/json", 
		"dojo/dom", 
		"dojo/dom-construct", 
		"dojo/on", 
		"dojox/mobile/RoundRectList",
		"dojox/mobile/ListItem",
		"dojo/_base/xhr",
		"dijit/registry",
		"dojo/domReady!"], 
	function(JSON, dom, domConstruct, on, RoundRectList, ListItem, xhr, registry){
		console.log("****Running runSearch()****");
		
		var switches = ["sw_mon", "sw_tue", "sw_wed", "sw_thu", "sw_fri", "sw_sat", "sw_sun"];
		if (day != "all") { //reset all the day switches to off
			for (i = 0; i < switches.length; i++) {
				var widget = registry.byId(switches[i]);
				widget.set("value", "off"); // "on" or "off" can be set
			}
			var d = new Date();
			var n = d.getDay();
			
			if (day == "today") {
				console.log("Enable sw_" + dayOfWeekAsString(n+1).toLowerCase());
				search_day = "sw_" +  dayOfWeekAsString(n+1).toLowerCase();
			} else {
				if (day == "tomorrow") {
					console.log("Enable sw_" + dayOfWeekAsString(n+2).toLowerCase());
					search_day = "sw_" +  dayOfWeekAsString(n+2).toLowerCase();
				}
			}
			var widget = registry.byId(search_day);
			widget.set("value", "on"); // "on" or "off" can be set
		}
				
		
		
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
		console.log("====SEARCH URL====" + search_url);
		// Destroy and recreate the holder for list results
		domConstruct.empty("output");
		var ul  = new RoundRectList({}, domConstruct.create("ul",{}, this.output) );
		ul.startup();

		markerClusterer.clearLayers();
		
		xhr.get({
	        url: search_url,
			handleAs:"json",
			load: function(data){
				var i = 0;
				dojo.forEach(data, function(datum) { 
					i++;
					html = dayOfWeekAsString(datum.weekday_tinyint) + "&nbsp;" ;
					html += datum.start_time.substring(0, 5) + "&nbsp;" 
					html += datum.meeting_name + "&nbsp;" 
					html += datum.location_text + "&nbsp;" 
					html += datum.location_street + "&nbsp;" ;
					html += datum.location_info;											
					li = new ListItem({
						"label"          : html,
						"variableHeight" : "true",
						"class"          : "subTotalListItem",
						"rightText"      : parseFloat(datum.distance_in_km).toFixed(1) + " kms"
					}, domConstruct.create("li",{}, ul.domNode) );
					li.startup();								   
					
					markerContent = "<p><b>" + datum.meeting_name + "</b></p>";
					markerContent += "<p><i>" + dayOfWeekAsString(datum.weekday_tinyint) + "&nbsp;" + datum.start_time.substring(0, 5) + "</i>&nbsp;&nbsp;";
					markerContent += datum.location_text + "&nbsp;" + datum.location_street + "<br>";
					markerContent += "<i>" + datum.location_info + "</i></p>";
					// Add markers to the markerClusterer Layer
					if (aMarker) {
						delete aMarker;
					}
					aMarker = new L.marker([datum.latitude, datum.longitude], {icon: naIcon}).bindPopup("<p>" + markerContent + "</p>");
					markerClusterer.addLayer(aMarker);
				});	

				document.getElementById("list_heading").innerHTML= '<h3 align="center">' + i + '&nbsp;Meetings</h3>';
				spinMap(false);
			}
		});
	});	
	// Add the markerClusterer layer to the map
	map.addLayer(markerClusterer);	
	console.log("Adjusting mapzoom to circle size");
	map.fitBounds(circle.getBounds());
}

dojo.addOnLoad( function() {
  // attach on click to id="search_all"
  dojo.query('#search_all').onclick( function(evt) { 
	refreshMap("all");
	});
});

dojo.addOnLoad( function() {
  dojo.query('#tab-search1').onclick( function(evt) { 
	refreshMap("all");
	});
});

dojo.addOnLoad( function() {
  dojo.query('#tab-search2').onclick( function(evt) { 
	refreshMap("all");
	});
});

dojo.addOnLoad( function() {
  dojo.query('#tab-search3').onclick( function(evt) { 
	refreshMap("all");
	});
});

dojo.addOnLoad( function() {
  dojo.query('#search_today').onclick( function(evt) { 
	refreshMap("today");
	});
});

dojo.addOnLoad( function() {
  dojo.query('#search_tomorrow').onclick( function(evt) { 
	refreshMap("tomorrow");
	});
});

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
		"value"	:	15 ,
		"min"	:	1 ,
		"max"	:	150,
		"step"	:	1 ,
		"type"	:	"range", 
		"intermediateChanges" : true,
		"style"	:	"width:90%;",
		"onChange" : function(newValue){ 	
			searchRadius =  newValue; 
			document.getElementById('radiusLabel').innerHTML= "&nbsp;Search radius =&nbsp;" + searchRadius + "&nbsp;kms";	
		}
	}, domConstruct.create("slid",{}, this.sliderHere));
	
//	dojo.connect(dojo.byId("slid"),"onmouseup", function(){refreshMap();});
	slid.startup();
					
	var sw_sun = new Switch({id:"sw_sun", value:"on", leftLabel:"Sun"});
	sw_sun.placeAt(this.SunSwitchHere); 
	sw_sun.startup();
	var sw_sun_listen = registry.byId("sw_sun");
	sw_sun_listen.on("stateChanged", function(newState){
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
		if (newState == "off") {
			searchSat = -1;
		} else {
			searchSat = 1; 
		}
	});			
	
	// Initialise the map
	initMap();
});			
