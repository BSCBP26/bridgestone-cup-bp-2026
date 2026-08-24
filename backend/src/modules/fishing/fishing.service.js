import {getSupabaseAdminClient} from "../../config/supabase.js";
import {AppError} from "../../shared/app-error.js";

const SPORT_ID="sport-fishing",PAIR_PREFIX="PAIR:";
const decode=row=>{try{const anglers=JSON.parse(row.employee_number.slice(PAIR_PREFIX.length));return{id:row.id,teamName:row.name,anglerOne:anglers[0],anglerTwo:anglers[1]}}catch{return null}};
export async function listFishingPairs(client=getSupabaseAdminClient()){
  const{data,error}=await client.from("participants").select("id, name, employee_number").eq("sport_id",SPORT_ID).eq("is_active",true).like("employee_number",`${PAIR_PREFIX}%`).order("name");
  if(error)throw new AppError(502,"Fishing pairs could not be loaded");
  return data.map(decode).filter(Boolean);
}
export async function replaceFishingPairs(pairs,client=getSupabaseAdminClient()){
  const{data:existing,error:loadError}=await client.from("participants").select("id, name, employee_number").eq("sport_id",SPORT_ID);
  if(loadError)throw new AppError(502,"Existing fishing pairs could not be loaded");
  const saved=[];
  for(const pair of pairs){const encoded=PAIR_PREFIX+JSON.stringify([pair.anglerOne,pair.anglerTwo]);const current=existing.find(row=>row.id===pair.id)||existing.find(row=>row.name.toLowerCase()===pair.teamName.toLowerCase());let result;if(current){result=await client.from("participants").update({name:pair.teamName,employee_number:encoded,is_active:true}).eq("id",current.id).select("id, name, employee_number").single();if(!result.error&&current.name!==pair.teamName){const synced=await client.from("tournament_entries").update({display_name:pair.teamName}).eq("tournament_id","fishing-bp-2026").eq("participant_id",current.id);if(synced.error)throw new AppError(422,"Fishing ranking name could not be synchronized");}}else result=await client.from("participants").insert({sport_id:SPORT_ID,name:pair.teamName,employee_number:encoded,is_active:true}).select("id, name, employee_number").single();if(result.error||!result.data)throw new AppError(422,"Fishing pair could not be saved");saved.push(decode(result.data));}
  const activeIds=new Set(saved.map(row=>row.id));const stale=existing.filter(row=>row.employee_number?.startsWith(PAIR_PREFIX)&&!activeIds.has(row.id)).map(row=>row.id);
  if(stale.length){const{error}=await client.from("participants").update({is_active:false}).in("id",stale);if(error)throw new AppError(422,"Old fishing pairs could not be deactivated");}
  return saved;
}
