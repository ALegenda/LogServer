import { SrcdsLogReceiver } from '@srcds/log-receiver';

const receiver = new SrcdsLogReceiver({
	hostname: '0.0.0.0',
	port: 9871,

	onlyRegisteredServers: false
});

receiver.addServers({
    hostname: 'oberyn.dathost.net',
    port: 27502,
    password: 'raupe'
});

receiver.on('log', (log) => {
	console.log('Log', log);
});

receiver.on('error', (error) => {
	console.log('error', error);
});

async function run() {
	await receiver.listen();

	console.log('Server running');
}

run().catch(console.log);