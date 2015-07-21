var Docker = require('dockerode');
var fs     = require('fs');

var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
var stats  = fs.statSync(socket);

if (!stats.isSocket()) {
  throw new Error('Are you sure the docker is running?');
}

var docker = new Docker({ socketPath: socket });
var optsc = {
  'Hostname': '',
  'User': '',
  'AttachStdin': true,
  'AttachStdout': true,
  'AttachStderr': true,
  'Tty': true,
  'OpenStdin': true,
  'StdinOnce': false,
  'Env': null,
  'Cmd': ['/bin/bash'],
  'Dns': ['8.8.8.8', '8.8.4.4'],
  'Image': 'dl.dockerpool.com:5000/ubuntu',
  'Volumes': {},
  'VolumesFrom': []
};

var previousKey,
    CTRL_P = '\u0010',
    CTRL_Q = '\u0011';

// Resize tty
function resize (container) {
  var dimensions = {
    h: process.stdout.rows,
    w: process.stderr.columns
  };

  if (dimensions.h != 0 && dimensions.w != 0) {
    container.resize(dimensions, function() {});
  }
}

var getHandler = function(stdin, stdout) {
	return function handler(err, container) {
		var attach_opts = {stream: true, stdin: true, stdout: true, stderr: true};
		container.attach(attach_opts, function(err, stream){
			stream.setEncoding('utf8');
			stdin.pipe(stream);
			stream.on('data', function(data){
				stdout.push(data);
			});

			stdin.on('data', function(key) {
				// Detects it is detaching a running container
				if (previousKey === CTRL_P && key === CTRL_Q) container.stop();
				previousKey = key;
			});

			container.start(function(err, data) {
				container.wait(function(err, data) {
					console.log('container exit');
				});
			});

		});
	}

};

module.exports = {
	create: function(stdin, stdout){
		docker.createContainer(optsc, getHandler(stdin, stdout));
	}
}

