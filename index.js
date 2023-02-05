import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';
import fetch from "node-fetch";

let stats = {}

let map_name = ""

let first_half = true

let teams = {
    team1: {
        name: "",
        score: 0
    },
    team2: {
        name: "",
        score: 0
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

function suicideKill(player) {
    if (stats[player.steamId]) {
        stats[player.steamId].deaths += 1;
        stats[player.steamId].kills -= 1;
    }
    else {
        stats[assistant.steamId] = {
            "steamId": assistant.steamId,
            "nickName": assistant.name,
            "kills": -1,
            "assists": 0,
            "deaths": 1,
        }
    }
}

function roundEnd() {

    let results = Object.keys(stats).map((key) => stats[key]);
    let results_for_site = results.map(player => {
        return {
            "steamId": player.steamId,
            "nickName": player.nickName,
            "kills": player.kills,
            "assists": player.assists,
            "deaths": player.deaths,
        }
    })
    //write results
    fetch('https://rcl-testing.onrender.com/test', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "playerStats": results_for_site,
            "mapName": map_name,
            "team1": {
                "name": teams.team1.name,
                "score": teams.team1.score
            },
            "team2": {
                "name": teams.team2.name,
                "score": teams.team2.score
            }
        })
    })
        .then(response => response.json())
        .then(response => console.log("round data send"))

    fetch('https://api.itsport.pro/round', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "playerStats": results_for_site,
            "mapName": map_name,
            "team1": {
                "name": teams.team1.name,
                "score": teams.team1.score
            },
            "team2": {
                "name": teams.team2.name,
                "score": teams.team2.score
            }
        })
    })
        .then(response => response.json())
        .then(response => console.log("round data send"))


}

function mapEnd() {
    let results = Object.keys(stats).map((key) => stats[key]);
    let results_for_site = results.map(player => {
        return {
            "steamId": player.steamId,
            "nickName": player.nickName,
            "kills": player.kills,
            "assists": player.assists,
            "deaths": player.deaths,
        }
    })
    fetch('https://rcl-testing.onrender.com/test', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "playerStats": results_for_site,
            "mapName": map_name,
            "team1": {
                "name": teams.team1.name,
                "score": teams.team1.score
            },
            "team2": {
                "name": teams.team2.name,
                "score": teams.team2.score
            }
        })
    })
        .then(response => response.json())
        .then(response => console.log("round data send"))

    fetch('https://api.itsport.pro/games', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "playerStats": results_for_site,
            "mapName": map_name,
            "team1": {
                "name": teams.team1.name,
                "score": teams.team1.score
            },
            "team2": {
                "name": teams.team2.name,
                "score": teams.team2.score
            }
        })
    })
        .then(response => response.json())
        .then(response => console.log("map data send"))
    // console.log({
    //     "playerStats" : results_for_site,
    //     "mapName" : map_name,
    //     "status" : "finished",
    //     "finishedAt" : new Date(),
    //     "team1Score": teams.team1.score,
    //     "team2Score": teams.team2.score
    // })
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
    //console.log('Log', log);
    // console.log('Parsed', parsed);

    if (!parsed) return

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'match_start') {
        stats = {}
        first_half = true
        map_name = parsed.payload.value
        console.log(`Match start on map ${map_name}`);
    }

    if (parsed.type === 'killed') {
        console.log(`${parsed.payload.attacker.name} kill ${parsed.payload.victim.name}`);
        playerKill(parsed.payload.attacker, parsed.payload.victim)
    }

    if (parsed.type === 'suicide') {
        console.log(`${parsed.payload.player.name} suicide`);
        suicideKill(parsed.payload.player)
    }

    if (parsed.type === 'assist') {
        console.log(`${parsed.payload.assistant.name} assist on kill ${parsed.payload.victim.name}`);
        assistKill(parsed.payload.assistant)
    }

    if (parsed.type === 'team_name') {
        console.log(`Recive team name ${parsed.payload.name}`);
        if (parsed.payload.team.name === 'COUNTER_TERRORISTS') {
            teams.team1.name = parsed.payload.name
        } else {
            teams.team2.name = parsed.payload.name
        }

    }

    if (parsed.type === 'team_triggered') {
        console.log(`Round end with score ${parsed.payload.counterTerroristScore} - ${parsed.payload.terroristScore}`);
        if (parsed.payload.counterTerroristScore + parsed.payload.terroristScore === 15) {
            first_half = false
        }
        if (first_half) {
            teams.team1.score = parsed.payload.counterTerroristScore
            teams.team2.score = parsed.payload.terroristScore
        }
        else {
            teams.team2.score = parsed.payload.counterTerroristScore
            teams.team1.score = parsed.payload.terroristScore
        }
    }

    if (parsed.type === 'entity_triggered' && parsed.payload.kind === 'round_end') {
        roundEnd()
        if (teams.team1.score === 16 && teams.team2.score < 15) {
            mapEnd()
        }
        if (teams.team2.score === 16 && teams.team1.score < 15) {
            mapEnd()
        }
        if (teams.team1.score > 16 && teams.team1.score - 3 > teams.team2.score) {
            mapEnd()
        }

        if (teams.team2.score > 16 && teams.team2.score - 3 > teams.team1.score) {
            mapEnd()
        }
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