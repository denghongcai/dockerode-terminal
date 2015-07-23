var express = require('express');
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var Docker = require('./docker');
var stream = require('stream');
app.use(express.static(__dirname + '/public'));
io.on('connection', function(socket){
	if(Docker.currentInstance > 10) {
		socket.disconnect();
		return;
	}
	console.log('connect');
	var stdin = new stream.Readable();
	stdin['disconnect'] = false;
	var stdout = new stream.Readable();
	stdin.setEncoding('utf8');
	stdout.setEncoding('utf8');
	stdin._read = function(){};
	stdout._read = function(){};
	Docker.create(stdin, stdout);
	stdout.on('data', function(data){
		socket.emit('data', data);
	});
	socket.on('data', function(data){
		stdin.push(data);
	});
	socket.on('resize', function(data){
		stdin.emit('resize', data);
	});
	socket.on('disconnect', function(){
		stdin.emit('disconnect');
		stdin['disconnect'] = true;
		console.log('disconnect');
	});

});

process.on('SIGINT', function () {
	Docker.docker.listContainers(function (err, containers) {
		containers.forEach(function (containerInfo, index, arr) {
			Docker.docker.getContainer(containerInfo.Id).stop(function(err, data){
				Docker.docker.getContainer(containerInfo.Id).remove(function(err, data){
					if(index === arr.length -1 ) {
						process.exit(0);
					}
				});
			});
		});
	});
});
server.listen(3000);
