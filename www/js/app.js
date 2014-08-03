// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

var socket = io.connect("172.18.1.251:3000");

angular.module('starter', ['ionic', 'starter.controllers', 'ngCordova', 'btford.socket-io'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/side-menu.html"
    })

    .state('app.main', {
      url: "/main",
      views: {
        'menuContent' :{
          templateUrl: "templates/main.html"
        }
      }
    })

    .state('app.play', {
      url: "/play",
      views: {
        'menuContent' :{
          templateUrl: "templates/play.html"
        }
      }
    })

    .state('app.enter-name', {
      url: "/enter-name",
      views: {
        'menuContent' :{
          templateUrl: "templates/enter-name.html"
        }
      }
    })

    .state('app.single', {
      url: "/single",
      views: {
        'menuContent' :{
          templateUrl: "templates/single.html",
          controller: "SinglePlayerCtrl"
        }
      }
    })

    .state('app.multiplayer', {
      url: "/multiplayer",
      views: {
        'menuContent' :{
          templateUrl: "templates/multiplayer.html",
          controller: "MultiCtrl"
        }
      }
    })

    .state('app.geo', {
      url: "/geo",
      views: {
        "menuContent": {
          templateUrl: "templates/geo.html",
          controller: "GeoCtrl"
        }
      }
    })
    .state('app.end', {
      url: "/end",
      views: {
        "menuContent": {
          templateUrl: "templates/gameover.html",
          controller: "EndGameCtrl"
        }
      }
    })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/play');
})
.factory('mySocket', function (socketFactory) {
    var myIoSocket = io.connect('http://172.18.1.251:3000');

    var mySocket = socketFactory({
      ioSocket: myIoSocket
    });

    return mySocket;
}).factory('twerkometer', ['$cordovaDeviceMotion', function twerkometer($cordovaDeviceMotion) {

  function Vector(x, y, z) {

    this.x = x;
    this.y = y;
    this.z = z;

    this.magnitude = function() {
      return Math.sqrt(x*x + y*y + z*z);
    }

    this.multiply = function(factor) {
      return new Vector(x * factor, y * factor, z * factor);
    }

    this.add = function(vector) {
      return new Vector(x + vector.x, y + vector.y, z + vector.z);
    }

    this.subtract = function(vector) {
      return new Vector(x - vector.x, y - vector.y, z - vector.z);
    }

    this.dot = function(vector) {
      return x * vector.x + y * vector.y + z * vector.z;
    }

    this.normalise = function() {
      var n = 1/this.magnitude();
      return new Vector(x*n, y*n, z*n);
    }

    this.jiggle = function(amount) {
      function j(num, amount) { return num + (Math.random() - 0.5) * amount; }
      return new Vector(j(x, amount), j(y, amount), j(z, amount));
    }

  }

  function DataPoint(time, vector) {
    this.time = time;
    this.vector = vector;
  }

  function TwerkDetector(threshold, frames, iterations, jiggle) {

    var dataPoints = [];
    var filteredPoints = [];
    var twerkLine = new Vector(1, 0, 0);

    var totalTwerks = 0;
    var startTime = 0;
    var endTime = 0;

    this.add = function(dataPoint) {
      dataPoints.push(dataPoint);

      while(dataPoints.length > frames) {
        dataPoints.shift();
      }

      this.process();

      if(this.twerkDetected()) {
        totalTwerks++;
      }

      if(startTime == 0) {
        startTime = Date.now();
      }
      endTime = Date.now();
    }

    this.process = function() {
      solveTwerkLine();
      filterPoints();
    }

    this.reset = function() {
      dataPoints = [];
      filteredPoints = [];
      twerkLine = new Vector(1, 0, 0);
      totalTwerks = 0;
      startTime = 0;
      endTime = 0;
    }

    this.stats = function() {
      var totalSeconds = (endTime - startTime) / 1000;
      return {
        totalSeconds: totalSeconds,
        totalTwerks: totalTwerks,
        twerksPerMinute: Math.round(60 * totalTwerks / totalSeconds)
      }
    }

    this.getRawPoints = function() {
      return dataPoints;
    }

    this.getFilteredPoints = function() {
      return filteredPoints;
    }

    this.twerkDetected = function() {
      if(filteredPoints.length < 2) {
        return false;
      }
      var len = filteredPoints.length;
      //console.log(filteredPoints[len - 1].vector.x);
      return filteredPoints[len - 1].vector.x != filteredPoints[len - 2].vector.x;
    }

    var solveTwerkLine = function() {
      for(var i = 0; i < iterations; i++) {
        stepTwerkLine();
      }
    }

    var stepTwerkLine = function() {
      var alteredTwerkLine = twerkLine.jiggle(jiggle).normalise();
      var error = twerkLineError(twerkLine);
      var alteredError = twerkLineError(alteredTwerkLine);
      if(alteredError < error) {
        twerkLine = alteredTwerkLine;
      }
    }

    var filterPoints = function() {
      filteredPoints = dataPoints.map(function(dataPoint) {
        var x = twerkLine.dot(dataPoint.vector);
        return new DataPoint(dataPoint.time, new Vector(x, 0, 0));
      });
      var total = 0;
      for(var i = 0; i < filteredPoints.length; i++) {
        total += filteredPoints[i].vector.x;
      }
      var average = total / filteredPoints.length;
      for(var i = 0; i < filteredPoints.length; i++) {
        filteredPoints[i].vector.x -= average;
      }
      var clampedValue = -1;
      for(var i = 0; i < filteredPoints.length; i++) {
        x = filteredPoints[i].vector.x;
        if(x > threshold && clampedValue < 0) {
          filteredPoints[i].vector.x = 1;
          clampedValue = 1;
        } else if(x < -threshold && clampedValue > 0) {
          filteredPoints[i].vector.x = -1;
          clampedValue = -1;
        } else {
          filteredPoints[i].vector.x = clampedValue;
        }
      }
    }

    var twerkLineError = function (line) {
      var error = 0;
      dataPoints.forEach(function(dataPoint) {
        error += linePointDistance(line, dataPoint.vector);
      });
      return error
    }

    var linePointDistance = function(line, point) {
      return line.multiply(point.dot(line)).subtract(point).magnitude();
    }

  }

  function FakeStats() {

    var totalTwerks = 0;
    var startTime = 0;
    var endTime = 0;

    this.add = function() {
      totalTwerks++;
      if(startTime == 0) {
        startTime = Date.now();
      }
      endTime = Date.now();
    }

    this.stats = function() {
      var totalSeconds = (endTime - startTime) / 1000;
      return {
        totalSeconds: totalSeconds,
        totalTwerks: totalTwerks,
        twerksPerMinute: Math.round(60 * totalTwerks / totalSeconds)
      }
    }
  }

  var twerkDetector = new TwerkDetector(3, 20, 30, 0.3);
  var fakeStats = new FakeStats();

  var resultProxy = {
    callback: function() {
      //To be reassigned in handler. Yuck :P
    },
    reset: function() {
      twerkDetector.reset();
    },
    stats: function() {
      return twerkDetector.stats();
    }
  };

  setInterval(function() {

    var time = Date.now() / 1000;
    var stats = {};

    if(navigator.accelerometer) {
      $cordovaDeviceMotion.getCurrentAcceleration().then(function(acc) {
        var dataPoint = new DataPoint(time, new Vector(acc.x, acc.y, acc.z));
        twerkDetector.add(dataPoint);
        if(twerkDetector.twerkDetected()) {
          resultProxy.callback(twerkDetector.stats());
        }
      }, function(err) {
        // An error occured. Show a message to the user
      });
    } else {
      if(Math.random() < 0.1) {
        fakeStats.add();
        resultProxy.callback(fakeStats.stats());
      }
    }


  }, 100);

  return resultProxy;
}]);
