window.newContactIcon = {
  url: window.IMG_PATH + 'map/new-marker.png',
  scaledSize: new google.maps.Size(62, 62),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(31, 31),
};

window.genericContactIcon = {
  url: window.IMG_PATH + 'map/marker.png',
  scaledSize: new google.maps.Size(62, 62),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(31, 31),
};

window.salesRepIcon = {
  url: window.IMG_PATH + 'map/salesRep.png',
  scaledSize: new google.maps.Size(50, 50),
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(25, 25),
};

window.defaultLocation = {
  lat: 40.0389,
  lng: -111.7331
};

window.mapStyle = [{
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{
      color: "#e0e1e0"
    }, ]
  }, {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{
      color: "#f2deae"
    }]
  },
  /*{
		featureType: "poi",
		elementType: "labels",
		stylers: [
			{ visibility: "off" }
		]
	},*/
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{
      color: "#c6dece"
    }]
  }, {
    featureType: "poi.business",
    elementType: "labels",
    stylers: [{
      visibility: "off"
    }]
  }, {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{
      color: "#d4d5d4"
    }, ]
  }, {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{
      color: "#cccdcc"
    }, ]
  }, {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{
      color: "#cccdcc"
    }, ]
  }, {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{
      color: "#ffffff"
    }, ]
  }, {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{
      color: "#FFC627"
    }, ]
  }, {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{
      color: "#CFA228"
    }, ]
  }, {
    featureType: "water",
    elementType: "geometry",
    stylers: [{
      color: "#6bbcc9"
    }, ]
  },
];
