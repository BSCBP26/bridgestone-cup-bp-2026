import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";

const number = value => Number(value) || 0;
export function calculateGroupStandings(rows) {
  return rows.map(row => ({
    name: row.name.trim(), played: number(row.played), won: number(row.won), drawn: number(row.drawn), lost: number(row.lost),
    scoreFor: number(row.scoreFor), scoreAgainst: number(row.scoreAgainst), points: number(row.won) * 3 + number(row.drawn)
  })).sort((a,b) => b.points-a.points || (b.scoreFor-b.scoreAgainst)-(a.scoreFor-a.scoreAgainst) || b.scoreFor-a.scoreFor || a.name.localeCompare(b.name)).map((row,index)=>({...row,rank:index+1}));
}

export function calculateRanking(rows) {
  return rows.map(row=>({name:row.name.trim(),score:Number(row.score)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).map((row,index)=>({...row,rank:index+1}));
}

export function selectQualifiers(groups, topPerGroup, tournamentId="tournament") {
  const entry=(groupIndex,rankIndex)=>{const row=groups[groupIndex].rows[rankIndex];return{id:`${tournamentId}-g${groupIndex+1}-r${row.rank}`,name:row.name}};
  const qualifiers=[];
  for(let groupIndex=0;groupIndex<groups.length;groupIndex+=2){const next=groupIndex+1;if(next>=groups.length){for(let rank=0;rank<topPerGroup;rank++)qualifiers.push(entry(groupIndex,rank));continue}if(topPerGroup===1){qualifiers.push(entry(groupIndex,0),entry(next,0));continue}qualifiers.push(entry(groupIndex,0),entry(next,1),entry(next,0),entry(groupIndex,1));}
  return qualifiers;
}

export async function listStandings(tournamentId, client=getSupabaseAdminClient()) {
  const {data,error}=await client.from("standings").select("group_name, rank, played, won, drawn, lost, points, score_for, score_against, tournament_entries!inner(display_name)").eq("tournament_id",tournamentId).order("group_name").order("rank");
  if(error) throw new AppError(502,"Standings could not be loaded");
  const groups=new Map();
  for(const row of data){if(!groups.has(row.group_name))groups.set(row.group_name,[]);groups.get(row.group_name).push({name:row.tournament_entries.display_name,rank:row.rank,played:row.played,won:row.won,drawn:row.drawn,lost:row.lost,points:row.points,scoreFor:row.score_for,scoreAgainst:row.score_against});}
  return [...groups].map(([name,rows])=>({name,rows}));
}

export async function replaceStandings(tournamentId, groups, client=getSupabaseAdminClient()) {
  const {data:tournament,error:tournamentError}=await client.from("tournaments").select("id, sport_id").eq("id",tournamentId).single();
  if(tournamentError||!tournament) throw new AppError(404,"Tournament not found");
  const {data:sport,error:sportError}=await client.from("sports").select("participant_type").eq("id",tournament.sport_id).single();
  if(sportError||!sport) throw new AppError(404,"Sport not found");
  const calculated=groups.map(group=>({name:group.name.trim().toUpperCase(),rows:calculateGroupStandings(group.rows)}));
  const {error:deleteError}=await client.from("standings").delete().eq("tournament_id",tournamentId);
  if(deleteError) throw new AppError(502,"Existing standings could not be replaced");
  const records=[];
  for(const group of calculated){for(const row of group.rows){
    let entryInput,entryConflict;
    if(sport.participant_type==="team"){
      const {data:team,error:teamError}=await client.from("teams").upsert({sport_id:tournament.sport_id,name:row.name},{onConflict:"sport_id,name"}).select("id").single();
      if(teamError) throw new AppError(422,"Standing team could not be saved");entryInput={tournament_id:tournamentId,team_id:team.id,display_name:row.name};entryConflict="tournament_id,team_id";
    }else{
      let {data:participant,error:participantError}=await client.from("participants").select("id").eq("sport_id",tournament.sport_id).eq("name",row.name).limit(1).maybeSingle();
      if(participantError)throw new AppError(422,"Standing participant could not be loaded");
      if(!participant){const created=await client.from("participants").insert({sport_id:tournament.sport_id,name:row.name}).select("id").single();participant=created.data;participantError=created.error;}
      if(participantError||!participant)throw new AppError(422,"Standing participant could not be saved");entryInput={tournament_id:tournamentId,participant_id:participant.id,display_name:row.name};entryConflict="tournament_id,participant_id";
    }
    const {data:entry,error:entryError}=await client.from("tournament_entries").upsert(entryInput,{onConflict:entryConflict}).select("id").single();
    if(entryError) throw new AppError(422,"Tournament entry could not be saved");
    records.push({tournament_id:tournamentId,group_name:group.name,entry_id:entry.id,rank:row.rank,played:row.played,won:row.won,drawn:row.drawn,lost:row.lost,points:row.points,score_for:row.scoreFor,score_against:row.scoreAgainst});
  }}
  if(records.length){const {error}=await client.from("standings").insert(records);if(error)throw new AppError(422,"Standings could not be saved");}
  return calculated;
}

export async function replaceRanking(tournamentId, rows, client=getSupabaseAdminClient()) {
  const {data:tournament,error:tournamentError}=await client.from("tournaments").select("id, sport_id").eq("id",tournamentId).single();
  if(tournamentError||!tournament)throw new AppError(404,"Tournament not found");
  const ranked=calculateRanking(rows);
  const records=[];
  for(const row of ranked){let {data:participant,error}=await client.from("participants").select("id").eq("sport_id",tournament.sport_id).eq("name",row.name).limit(1).maybeSingle();if(error)throw new AppError(422,"Fishing participant could not be loaded");if(!participant){const created=await client.from("participants").insert({sport_id:tournament.sport_id,name:row.name}).select("id").single();participant=created.data;error=created.error;}if(error||!participant)throw new AppError(422,"Fishing participant could not be saved");const entryResult=await client.from("tournament_entries").upsert({tournament_id:tournamentId,participant_id:participant.id,display_name:row.name},{onConflict:"tournament_id,participant_id"}).select("id").single();if(entryResult.error)throw new AppError(422,"Fishing tournament entry could not be saved");records.push({tournament_id:tournamentId,group_name:"FISHING RANKING",entry_id:entryResult.data.id,rank:row.rank,played:1,won:0,drawn:0,lost:0,points:row.score,score_for:row.score,score_against:0});}
  const {error:deleteError}=await client.from("standings").delete().eq("tournament_id",tournamentId);if(deleteError)throw new AppError(502,"Existing fishing ranking could not be replaced");
  if(records.length){const {error}=await client.from("standings").insert(records);if(error)throw new AppError(422,"Fishing ranking could not be saved");}
  return ranked;
}
