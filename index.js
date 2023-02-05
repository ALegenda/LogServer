import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';

let stats = {}

let map_name = ""

let first_half = true

let teams = {
    team1 : {
        name : "",
        score : 0
    },
    team2 : {
        name : "",
        score : 0
    }
}

function playerKill(attacker, victim) {
    if (stats[attacker.steamId]) {
        stats[attacker.steamId].kills += 1;
    }
    else {
        stats[attacker.steamId] = {
            "steamId": attacker.steamId,
            "nickName": attacker.name,
            "kills": 1,
            "assists": 0,
            "deaths": 0,
        }
    }
    if (stats[victim.steamId]) {
        stats[victim.steamId].deaths += 1;
    }
    else {
        stats[victim.steamId] = {
            "steamId": victim.steamId,
            "nickName": victim.name,
            "kills": 0,
            "assists": 0,
            "deaths": 1,
        }
    }

}

function assistKill(assistant) {
    if (stats[assistant.steamId]) {
        stats[assistant.steamId].assists += 1;
    }
    else {
        stats[assistant.steamId] = {
            "steamId": assistant.steamId,
            "nickName": assistant.name,
            "kills": 0,
            "assists": 1,
            "deaths": 0,
        }
    }
}

function roundEnd() {
    //write results
    console.log(stats)
    console.log(teams)
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
    console.log('Log', log);
    // console.log('Parsed', parsed);

    if (!parsed) return
    console.log('Parsed', parsed);

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'match_start') {
        stats = {}
        map_name = parsed.payload.value
    }

    if (parsed.type === 'killed') {
        playerKill(parsed.payload.attacker, parsed.payload.victim)
    }

    if (parsed.type === 'assist') {
        assistKill(parsed.payload.assistant)
    }

    if (parsed.type === 'team_triggered') {
        if(first_half){
            teams.team1.score = parsed.payload.counterTerroristScore
            teams.team2.score = parsed.payload.terroristScore
        }
        else{
            teams.team2.score = parsed.payload.counterTerroristScore
            teams.team1.score = parsed.payload.terroristScore
        }
    }

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'round_end') {
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