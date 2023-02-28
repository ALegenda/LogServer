import { DemoFile, Player, TeamNumber } from "demofile";
import * as fs from "fs";

interface PlayerStats {
    playerName: string;
    kills: number;
    deaths: number;
    assists: number;
    damage: any;
    headshots: number;
    //awp: number;
    //first: number;
    rounds: number;
    damage_p_r: number;
    kills_p_r: number;
    deaths_p_r: number;
    oneplus_percent: number;
    assist_p_r: number;
    headshots_p_r: number;
    headshots_percent: number;
}

let maxDamageName = ""
let maxDamage = 0

//kd: player.kills / player.deaths,
//adr: player.matchStats.map(item => item.damage).reduce((a, b) => a + b) / player.matchStats.length,

let week_stats: Record<string, PlayerStats> = {};

function parseDemoFile(path: string) {
    const stream = fs.createReadStream(path);
    const demoFile = new DemoFile();
    console.log(`Start parsing ${path}`);

    const stats: Record<string, PlayerStats> = {};

    let rounds = 1;

    function capturePlayerStats(player: Player) {
        // Skip over bots and GOTV
        if (!player) return;
        if (player.isFakePlayer) return;
        if (!player.team) return;
        if (player.team?.teamName.toString() === 'Spectator') return;
        let damage = player.matchStats.map(item => item.damage).reduce((a, b) => a + b)
        let headshots = player.matchStats.map(item => item.headShotKills).reduce((a, b) => a + b)
        let oneplus = player.matchStats.map(item => item.kills).filter(item => item > 1).length

        stats[player.steamId] = {
            playerName: player.name,
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            damage: damage,
            headshots: headshots,
            //awp: 0,
            //first: 0,
            rounds: rounds,
            oneplus_percent: parseFloat((oneplus / rounds).toFixed(2)),
            damage_p_r: parseFloat((damage / rounds).toFixed(2)),
            kills_p_r: parseFloat((player.kills / rounds).toFixed(2)),
            deaths_p_r: parseFloat((player.deaths / rounds).toFixed(2)),
            assist_p_r: parseFloat((player.assists / rounds).toFixed(2)),
            headshots_p_r: parseFloat((headshots / rounds).toFixed(2)),
            headshots_percent: parseFloat((headshots / player.kills).toFixed(2))
        };
        if(rounds > 0){
            if (parseFloat((damage / rounds).toFixed(2)) > maxDamage){
                maxDamageName = player.name
                maxDamage = parseFloat((damage / rounds).toFixed(2))
            }
        }
    }

    function logStats(stats: Record<string, PlayerStats>) {
        let results = Object.keys(stats).map((key) => stats[key]);
        let results_for_site = results.map(player => {
            return {
                "nickName": player.playerName,
                "kills": player.kills,
                //"adr": player.adr,
                //"awp_kill": player.awp_kill,
                "headshots": player.headshots,
            }
        })

        //make request for back with round results

        return results_for_site
    }

    demoFile.gameEvents.on("player_disconnect", ({ userid }) => {
        const player = demoFile.entities.getByUserId(userid)!;
        rounds = demoFile.teams[TeamNumber.Terrorists].score + demoFile.teams[TeamNumber.CounterTerrorists].score
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
        rounds = demoFile.teams[TeamNumber.Terrorists].score + demoFile.teams[TeamNumber.CounterTerrorists].score
        demoFile.players.forEach(capturePlayerStats);
        console.table(stats);
        //console.log(JSON.stringify(logStats(stats)))

        //sum with week stats
        

        console.log(`Current max damage player is ${maxDamageName} with ${maxDamage}`)
    });

    // Start parsing the stream now that we've added our event listeners
    demoFile.parseStream(stream);
}

const testFolder = 'C:/Users/User/Documents/Demos';
fs.readdir(testFolder, (err, files) => {
    files.forEach(file => {
        parseDemoFile(`C:/Users/User/Documents/Demos/${file}`)
    });
  });
