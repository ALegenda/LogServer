import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';

const buffer = {}
const matchStart = false

const receiver = new SrcdsLogReceiver({
	hostname: '0.0.0.0',
	port: 9872,

	onlyRegisteredServers: false
});

receiver.addServers({
    hostname: 'oberyn.dathost.net',
    port: 27502,
    password: 'raupe'
});

receiver.on('log', (log) => {
    const parsed = parse(log.payload);
    console.log('Log', log);
    console.log('Parsed', parsed);
    if (parsed.type === "server_log"){
        
    }
});

receiver.on('error', (error) => {
	console.log('error', error);
});

async function run() {
	await receiver.listen();

	console.log('Server running');
}

run().catch(console.log);