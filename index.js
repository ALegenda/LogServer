const CSGOLogReceiver = require('csgo-log-receiver');

const receiver = new CSGOLogReceiver({
    host: '0.0.0.0', 
    port: 9871
});

// Registration of the server from which you want to receive logs
receiver.registerSource({
    address: 'oberyn.dathost.net',
    port: 27502,
    password: 'raupe'
});

receiver.on('error', ({server, error}) => {
    console.error('Error on server', receiver.stringifyServerId(server), '#' + error);
});

receiver.on('log', ({server, message}) => {
    console.log("kek")
    console.log(receiver.stringifyServerId(server), message);
});