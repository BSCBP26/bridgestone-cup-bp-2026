import { env } from "../../config/env.js";
import { getSupabaseAdminClient } from "../../config/supabase.js";
import { AppError } from "../../shared/app-error.js";

const defaults={badminton:["doubles"],"table-tennis":["singles"]};
const memory=new Map();
export async function findCategories(slug){if(!env.supabaseConfigured)return memory.get(slug)||defaults[slug];const{data,error}=await getSupabaseAdminClient().from("sport_category_settings").select("active_categories").eq("sport_slug",slug).maybeSingle();if(error)throw new AppError(502,"Competition categories could not be loaded");return data?.active_categories||defaults[slug]}
export async function saveCategories(slug,categories){if(!env.supabaseConfigured){memory.set(slug,[...categories]);return categories}const{data,error}=await getSupabaseAdminClient().from("sport_category_settings").upsert({sport_slug:slug,active_categories:categories},{onConflict:"sport_slug"}).select("active_categories").single();if(error||!data)throw new AppError(502,"Competition categories could not be saved");return data.active_categories}
export function clearCategorySettings(){memory.clear()}
