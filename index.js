const Gamedig = require('gamedig');
Gamedig.query({
    type: 'csgo',
    host: 'oberyn.dathost.net',
    port: '27502'
}).then((state) => {
    console.log(state);
}).catch((error) => {
    console.log(error);
    console.log("Server is offline");
});