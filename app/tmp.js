

var io = require('socket.io');
var socket = io('https://antsim.scm.azurewebsites.net');

socket.on('go north', function () {
    influence.north = !influence.north;
});

socket.on('go south', function () {
    influence.south = !influence.south;
});
socket.on('go east', function () {
    influence.east = !influence.east;
});
socket.on('go west', function () {
    influence.west = !influence.west;
});
socket.on('go random', function () {
    influence = {
        north: false,
        east: false,
        south: false,
        west: false
    };
});

function moveAnts() {
    ants.forEach(ant => ant.move(influence));
}