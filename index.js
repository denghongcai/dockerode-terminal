var express = require('express');
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var docker = require('./docker');
var stream = require('stream');
app.use(express.static(__dirname + '/public'));
io.on('connection', function(socket){
	var stdin = new stream.Readable();
	var stdout = new stream.Readable();
	stdin.setEncoding('utf8');
	stdout.setEncoding('utf8');
	stdin._read = function(){};
	stdout._read = function(){};
	docker.create(stdin, stdout);
	stdout.on('data', function(data){
		socket.emit('data', data);
	});
	socket.on('data', function(data){
		stdin.push(data);
	});
});
server.listen(3000);
