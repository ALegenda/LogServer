import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';

const stats = {}
const matchStart = false

const map_name = ""

function playerKill(attacker, victim) {
    if (stats[attacker.steamId]) {
        stats[attacker.steamId].kills += 1;
    }
    else {
        stats[attacker.steamId] = {
                "steamId" : attacker.steamId,
                "nickName" : attacker.name,
                "kills" : 1,
                "assists" : 0,
                "deaths" : 0,
        }
    }
    if (stats[victim.steamId]) {
        stats[victim.steamId].deaths += 1;
    }
    else {
        stats[victim.steamId] = {
            "steamId" : attacker.steamId,
            "nickName" : attacker.name,
            "kills" : 0,
            "assists" : 0,
            "deaths" : 1,
    }
    }

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

    if (!parsed) return

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'match_start') {
        console.log('Parsed', parsed);
        stats = {}
        map_name = parsed.payload.value
    }

    if (parsed.type === 'killed') {
        console.log('Parsed', parsed);
        playerKill(parsed.payload.attacker, parsed.payload.victim)
    }

    if (parsed.type === 'assist') {
        console.log('Parsed', parsed);
        assistKill(parsed.payload.assistant)
    }


    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'round_end') {
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