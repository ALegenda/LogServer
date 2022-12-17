const Gamedig = require('gamedig');
Gamedig.query({
    type: 'csgo',
    host: 'http://195.133.145.138/',
    port: '3000'
}).then((state) => {
    console.log(state);
}).catch((error) => {
    console.log(error);
    console.log("Server is offline");
});