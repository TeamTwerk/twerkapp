angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, mySocket, $cordovaDevice) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  },

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };

  $scope.changeState = function(state) {
    $state.go(state);
  };

  $scope.joinMultiplayer = function(username) {
    $state.go('app.multiplayer');
    mySocket.emit('matchmaking', {c: {uuid: getMyUUID(), name: username},  m: 'join'});
  };

  getMyUUID = function() {
    /*if($cordovaDevice.getDevice() == null) {
      return $cordovaDevice.getUUID();
    } else {
      return null;
    }*/
    return Date.now(); //Debug code for browser
  };

  mySocket.on('data', function(data) {
    console.log(data);

    switch(data.m) {
      case "updateRoom":
        console.log("UPDATE ROOM");
        break;
    }
  });

})

.controller('MultiCtrl', function($scope, $state, mySocket, $cordovaDevice, $cordovaVibration, twerkometer) {

  var myUUID = getMyUUID();
  var myUUDI = 1234;
  var playerReady = false;
  var countdownTimer;
  var matchInterval;

  $scope.leaveMultiplayer = function() {
    mySocket.emit('matchmaking', {m: 'leave'});
    $state.go('app.play');
  };

  $scope.readyCheck = function() {
    if(playerReady) {
      $scope.emitMessageData("unready");
      playerReady = false;
    } else {
      $scope.emitMessageData("ready");
      playerReady = true;
    }
  };

  $scope.startCountdown = function() {
    countdownTimer = setInterval(function() {
      $scope.countdown--;

      $scope.$apply();

      if($scope.countdown == 0) {
        clearInterval(countdownTimer);

        twerkometer.callback = function() {
          $scope.emitTwerkData(Math.random() * 450 + 50, Math.random() * 100 + 20);
        };

        matchInterval = setInterval(function() {
          $scope.duration--;

          $scope.$apply();

          if($scope.duration == 0) {
            clearInterval(matchInterval);
            mySocket.emit('leave', {c: $scope.currentRoomID});
            $state.go('app.play');
          }
        }, 1000);
      }
    }, 1000);
  };

  $scope.emitTwerkData = function(t, tpm) {
    mySocket.emit('data', {c: {roomId: $scope.currentRoomID, twerk: {t: t, tpm: tpm, uuid: myUUID}}, m: "twerk" } );
  };

  $scope.emitMessageData = function(data) {
    mySocket.emit('data', {c: {roomId: $scope.currentRoomID}, m: data});
  };

  mySocket.on('data', function(data) {
    console.log(data);

    switch(data.m) {
      case "startMatch":
        console.log("START MATCH");
        $scope.countdown = data.c.countdown;
        $scope.duration = data.c.duration;
        $scope.startCountdown();
        break;
    }
  });

  mySocket.on('matchmaking', function(data) {
    console.log(data);

    switch(data.m) {
      case "joinRoom":
        console.log("JOIN ROOM: " + data.c.roomId);
        $scope.currentRoomID = data.c.roomId;
        $scope.roomJoined = true;
        break;
    }
  });

  mySocket.on('err', function(data) {
    console.log(data);
  });
})

.controller('GeoCtrl', function ($scope, $ionicLoading, $compile, $cordovaGeolocation) {
  $scope.info = "balasasd";
   function initialize() {
      $cordovaGeolocation.getCurrentPosition().then(function(position) {
            // Position here: position.coords.latitude, position.coords.longitude

          var myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

          var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          var map = new google.maps.Map(document.getElementById("map"),
              mapOptions);

          //Marker + infowindow + angularjs compiled ng-click
          var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
          var compiled = $compile(contentString)($scope);

          var infowindow = new google.maps.InfoWindow({
            content: compiled[0]
          });

          var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: 'Uluru (Ayers Rock)'
          });

          google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map,marker);
          });

          $scope.map = map;
        }, function(err) {
          // error
        });
      }
      //google.maps.event.addDomListener(window, 'load', initialize);
      initialize();

      $scope.centerOnMe = function() {
        if(!$scope.map) {
          return;
        }

        $scope.loading = $ionicLoading.show({
          content: 'Getting current location...',
          showBackdrop: false
        });

        $cordovaGeolocation.getCurrentPosition().then(function(pos) {
          $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          $ionicLoading.hide();
        }, function(error) {
          alert('Unable to get location: ' + error.message);
        });
      };

      $scope.clickTest = function() {
        alert('Example of infowindow with ng-click')
      };
})

.controller('SinglePlayerCtrl', function($scope, $cordovaDialogs, $cordovaDeviceMotion, $cordovaVibration, twerkometer) {
  
  $scope.twerks = 0;
  $scope.twerksPerMinute = 0;

  twerkometer.callback = function(stats) {
    $scope.twerks = stats.totalTwerks;
    $scope.twerksPerMinute = stats.twerksPerMinute;
    $scope.$apply();
    if(navigator.notification) {
      $cordovaVibration.vibrate(50);
    }
  }

});
