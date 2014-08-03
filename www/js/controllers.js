angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, mySocket) {
  // Form data for the login
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
    mySocket.emit('matchmaking', {c: { name: username },  m: 'join'});
    $state.go('app.multiplayer');
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

.controller('MultiCtrl', function($scope, $state, $cordovaVibration, mySocket, twerkometer) {

  var playerReady = false;
  var countdownTimer;
  var matchInterval;


  $scope.leaveMultiplayer = function() {
    mySocket.emit('matchmaking', {m: 'leave'});
    $state.go('app.play');
    twerkometer.callback = function () {};
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

      if($scope.countdown <= 0) {
        clearInterval(countdownTimer);
        twerkometer.reset();
      }
      }, 1000);


        matchInterval = setInterval(function() {
          twerkometer.callback = function(stats) {
            $scope.emitTwerkData(stats.totalTwerks, stats.twerksPerMinute);
          };
          $scope.duration--;

          $scope.$apply();

          if($scope.duration <= 0) {
            clearInterval(matchInterval);
            mySocket.emit('leave', {c: $scope.currentRoomID});
            mySocket.emit('data', {m: "gameOver", c:{roomId: $scope.currentRoomId}})
            twerkometer.callback = function () {};
            $state.go('app.end');
          }
        }, 1000);
  };

  $scope.emitTwerkData = function(t, tpm) {
    mySocket.emit('data', {c: {roomId: $scope.currentRoomID, twerk: { t: t, tpm: tpm } }, m: "twerk" } );
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

.controller('SinglePlayerCtrl', function($scope, $cordovaVibration, twerkometer) {

  $scope.totalSeconds = 0;
  $scope.twerksPerMinute = 0;
  $scope.totalTwerks = 0;

  twerkometer.callback = function(stats) {
    console.log(stats);
    $scope.totalSeconds = stats.totalSeconds;
    $scope.twerksPerMinute = stats.twerksPerMinute;
    $scope.totalTwerks = stats.totalTwerks;
    $scope.$apply();
    if(navigator.notification) {
      $cordovaVibration.vibrate(50);
    }
  }

})

.controller('EndGameCtrl', function ($scope, $state, twerkometer) {
  $scope.stats = twerkometer.stats();
  $scope.goTo = function (path) {
    $state.go(path);
  };
});
