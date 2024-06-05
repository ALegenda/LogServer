import { SrcdsLogReceiver } from '@srcds/log-receiver';
import { parse } from '@srcds/log-parser';
import fetch from "node-fetch";

class PlayerStats {
    constructor(steamId, name) {
        this.steamId = steamId;
        this.nickName = name;
        this.kills = 0;
        this.assists = 0;
        this.deaths = 0;
    }

    recordKill() {
        this.kills += 1;
    }

    recordAssist() {
        this.assists += 1;
    }

    recordDeath() {
        this.deaths += 1;
    }

    recordSuicide() {
        this.deaths += 1;
        this.kills -= 1;
    }
}

class Team {
    constructor() {
        this.name = "";
        this.score = 0;
    }

    updateScore(score) {
        this.score = score;
    }
}

let stats = {};
let mapName = "";
let firstHalf = true;
let teams = { team1: new Team(), team2: new Team() };

function updatePlayerStats(player, action) {
    if (!stats[player.steamId]) {
        stats[player.steamId] = new PlayerStats(player.steamId, player.name);
    }
    if (action === 'kill') stats[player.steamId].recordKill();
    if (action === 'assist') stats[player.steamId].recordAssist();
    if (action === 'death') stats[player.steamId].recordDeath();
    if (action === 'suicide') stats[player.steamId].recordSuicide();
}

function logEvent(event) {
    console.log(event);
}

async function sendData(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log("Data sent:", result);
    } catch (error) {
        console.error("Failed to send data:", error);
    }
}

async function handleRoundEnd() {
    const results = Object.values(stats);
    const resultsForSite = results.map(player => ({
        steamId: player.steamId,
        nickName: player.nickName,
        kills: player.kills,
        assists: player.assists,
        deaths: player.deaths
    }));

    const data = {
        playerStats: resultsForSite,
        mapName: mapName,
        team1: { name: teams.team1.name, score: teams.team1.score },
        team2: { name: teams.team2.name, score: teams.team2.score }
    };

    await sendData('https://rcl-testing.onrender.com/test', data);
    await sendData('https://api2.itsport.pro/round', data);
}

async function handleMapEnd() {
    await handleRoundEnd();

    const delay = time => new Promise(resolve => setTimeout(resolve, time));
    await delay(5000);

    const results = Object.values(stats);
    const resultsForSite = results.map(player => ({
        steamId: player.steamId,
        nickName: player.nickName,
        kills: player.kills,
        assists: player.assists,
        deaths: player.deaths
    }));

    const data = {
        playerStats: resultsForSite,
        mapName: mapName,
        team1: { name: teams.team1.name, score: teams.team1.score },
        team2: { name: teams.team2.name, score: teams.team2.score }
    };

    await sendData('https://api2.itsport.pro/games', data);
}

const receiver = new SrcdsLogReceiver({
    hostname: '0.0.0.0',
    port: 9872,
    onlyRegisteredServers: false
});

receiver.addServers({
    hostname: 'hypnotic.dathost.net',
    password: '123'
});

receiver.on('log', (log) => {
    const parsed = parse(log.payload);
    if (!parsed) return;

    switch (parsed.type) {
        case 'entity_triggered':
            if (parsed.payload.kind === 'match_start') {
                stats = {};
                firstHalf = true;
                mapName = parsed.payload.value;
                logEvent(`Match start on map ${mapName}`);
            } else if (parsed.payload.kind === 'round_end') {
                handleRoundEnd();
                const team1Win = teams.team1.score === 13 && teams.team2.score < 13;
                const team2Win = teams.team2.score === 13 && teams.team1.score < 13;
                const team1Lead = teams.team1.score > 13 && teams.team1.score - 3 > teams.team2.score;
                const team2Lead = teams.team2.score > 13 && teams.team2.score - 3 > teams.team1.score;
                if (team1Win || team2Win || team1Lead || team2Lead) handleMapEnd();
            }
            break;
        case 'killed':
            logEvent(`${parsed.payload.attacker.name} killed ${parsed.payload.victim.name}`);
            updatePlayerStats(parsed.payload.attacker, 'kill');
            updatePlayerStats(parsed.payload.victim, 'death');
            break;
        case 'suicide':
            logEvent(`${parsed.payload.player.name} committed suicide`);
            updatePlayerStats(parsed.payload.player, 'suicide');
            break;
        case 'assist':
            logEvent(`${parsed.payload.assistant.name} assisted in killing ${parsed.payload.victim.name}`);
            updatePlayerStats(parsed.payload.assistant, 'assist');
            break;
        case 'team_name':
            logEvent(`Received team name ${parsed.payload.name}`);
            if (parsed.payload.team.name === 'COUNTER_TERRORISTS') {
                teams.team1.name = parsed.payload.name;
            } else {
                teams.team2.name = parsed.payload.name;
            }
            break;
        case 'team_triggered':
            logEvent(`Round end with score ${parsed.payload.counterTerroristScore} - ${parsed.payload.terroristScore}`);
            if (firstHalf) {
                teams.team1.score = parsed.payload.counterTerroristScore;
                teams.team2.score = parsed.payload.terroristScore;
            } else {
                teams.team2.score = parsed.payload.counterTerroristScore;
                teams.team1.score = parsed.payload.terroristScore;
            }
            if (parsed.payload.counterTerroristScore + parsed.payload.terroristScore === 12) firstHalf = false;
            if ((parsed.payload.counterTerroristScore + parsed.payload.terroristScore) >= 24 && (parsed.payload.counterTerroristScore + parsed.payload.terroristScore) % 3 === 0) firstHalf = !firstHalf;
            break;
        default:
            break;
    }
});

receiver.on('error', (error) => {
    console.error('Receiver error:', error);
});

async function run() {
    await receiver.listen();
    console.log('Server running');
}

run().catch(console.error);
