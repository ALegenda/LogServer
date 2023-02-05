import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';

const stats = {}
const matchStart = false

function playerKill(attacker, victim) {
    stats[attacker.steamId].kills += 1;
    stats[victim.steamId].deaths += 1;
}

function assistKill(assistant) {
    stats[assistant.steamId].assists += 1;
}

function roundEnd() {
    //write results
    console.log(stats)
}

const receiver = new SrcdsLogReceiver({
	hostname: '0.0.0.0',
	port: 9872,

	onlyRegisteredServers: false
});

receiver.addServers({
    hostname: 'oberyn.dathost.net',
    //port: 27642,
    password: '123'
});

receiver.on('log', (log) => {
    const parsed = parse(log.payload);
    // console.log('Log', log);
    // console.log('Parsed', parsed);

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'match_start' ){
        console.log('Parsed', parsed);
        stats = {}
    }

    if (parsed.type === 'killed'){
        console.log('Parsed', parsed);
        playerKill(parsed.payload.attacker, parsed.payload.victim)
    }

    if (parsed.type === 'assist'){
        console.log('Parsed', parsed);
        assistKill(parsed.payload.assistant)
    }


    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'round_end' ){
        console.log('Parsed', parsed);
        roundEnd()
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