angular.module('starter.controllers', ['ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $state, mySocket) {
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

  $scope.emitData = function(roomID, t, tpm) {
    mySocket.emit('data', {c: {roomId: roomID, twerk: {t: t, tpm: tpm}}} );
  };

  $scope.joinMultiplayer = function() {
    $state.go('app.multiplayer');
    mySocket.emit('matchmaking', {m: 'join'});
  };

  mySocket.on('data', function(data) {
    console.log(data);
  });

})

.controller('MultiCtrl', function($scope, $state, mySocket) {

  $scope.leaveMultiplayer = function() {
    $scope.emitMultiData('leave');
    $state.go('app.play');
  };

  $scope.emitMultiData = function(data) {
    mySocket.emit('matchmaking', {m: data});
  };

  mySocket.on('matchmaking', function(data) {
    console.log(data);

    switch(data) {
      case "joinRoom":
        console.log("JOIN ROOM");
        // handle join room stuff: {m: "joinRoom", c:{ roomId: 1235, opponent: "1231cw2ww"}}
        break;

      case "endGame":
        console.log("END GAME");
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
});
