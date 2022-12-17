var dgram = require('dgram'),
    server = dgram.createSocket('udp4');

server.on('message', function (message, rinfo) {
var msg = message.toString('ascii').slice(5,-1);    
console.log(msg);
    });


server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening ' + address.address + ':' + address.port);
});

server.bind(3000, function() {
  server.addMembership('195.133.145.138');
});