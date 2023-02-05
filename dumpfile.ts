/* eslint-disable no-console */

// This file is an advanced example of how to log player kills,
// team scores, chat text and server cvar changes from a demo file.

import * as fs from "fs";
import {
    DemoFile,
    extractPublicEncryptionKey,
    Player,
    TeamNumber
} from "demofile";

interface PlayerStats {
    team: string;
    steamId: string;
    playerName: string;
    kills: number;
    assists: number;
    deaths: number;
    adr: any;
}

const filePath = process.argv[2]!;
const stream = fs.createReadStream(filePath);
const demoFile = new DemoFile();

const stats: Record<string, PlayerStats> = {};

function capturePlayerStats(player: Player) {
    // Skip over bots and GOTV
    if(!player) return;
    if (player.isFakePlayer) return;
    if(!player.team) return;
    if (player.team?.teamName.toString() === 'Spectator') return;
    
    

    stats[player.steamId] = {
        team: player.team!.teamName,
        steamId: player.steamId,
        playerName: player.name,
        kills: player.kills,
        assists: player.assists,
        deaths: player.deaths,
        adr: player.matchStats.map(item => item.damage).reduce((a, b) => a + b) / player.matchStats.length
    };
}

function logStats(stats : Record<string, PlayerStats>){
    let results = Object.keys(stats).map((key) => stats[key]);
    let results_for_site = results.map(player => {
        return {
            "steamId" : player.steamId,
            "nickName" : player.playerName,
            "kills" : player.kills,
            "assists" : player.assists,
            "deaths" : player.deaths,
            //"adr" : player.adr
        }
    })

    //make request for back with round results

    return results_for_site
}

// Read the match info from a '.info' file if one exists alongside the demo.
if (fs.existsSync(filePath + ".info")) {
    const encryptionKey = extractPublicEncryptionKey(
        fs.readFileSync(filePath + ".info")
    );
    demoFile.setEncryptionKey(encryptionKey);
}


demoFile.on("start", () => {
    console.log("Demo header:", demoFile.header);

});

demoFile.gameEvents.on("round_announce_match_start", () => {
    console.log(`${demoFile.teams[TeamNumber.Terrorists].clanName} - ${demoFile.teams[TeamNumber.Terrorists].logoImage}`)
    console.log(`${demoFile.teams[TeamNumber.CounterTerrorists].clanName} - ${demoFile.teams[TeamNumber.CounterTerrorists].logoImage}`)
});

demoFile.gameEvents.on("player_disconnect", ({ userid }) => {
    const player = demoFile.entities.getByUserId(userid)!;
    capturePlayerStats(player);
});

demoFile.gameEvents.on("round_officially_ended", () => {
    demoFile.players.forEach(capturePlayerStats);
    //logStats(stats)
});

demoFile.on("end", e => {
    if (e.error) {
        console.error("Error during parsing:", e.error);
    }
    demoFile.players.forEach(capturePlayerStats);
    console.table(stats);
    console.log(JSON.stringify(logStats(stats)))
    console.log(`Finished with final score : ${demoFile.teams[TeamNumber.Terrorists].clanName} ${demoFile.teams[TeamNumber.Terrorists].score} - ${demoFile.teams[TeamNumber.CounterTerrorists].clanName} ${demoFile.teams[TeamNumber.CounterTerrorists].score}`);
});

demoFile.gameEvents.on("round_officially_ended", e => {
    //logTeamScores()
});


// Start parsing the stream now that we've added our event listeners
demoFile.parseStream(stream);