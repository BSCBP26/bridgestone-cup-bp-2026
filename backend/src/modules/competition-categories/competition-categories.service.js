import { AppError } from "../../shared/app-error.js";
import { findCategories,saveCategories } from "./competition-categories.repository.js";
const supported=new Set(["badminton","table-tennis"]),allowed=new Set(["singles","doubles"]);
function ensureSport(slug){if(!supported.has(slug))throw new AppError(404,"Competition categories are not available for this sport")}
export async function getCategories(slug){ensureSport(slug);const activeCategories=await findCategories(slug);return{sport:slug,activeCategories,mode:activeCategories.length===2?"both":activeCategories[0]}}
export async function updateCategories(slug,categories){ensureSport(slug);if(!Array.isArray(categories)||!categories.length||categories.length>2||categories.some(value=>!allowed.has(value))||new Set(categories).size!==categories.length)throw new AppError(422,"activeCategories must contain singles, doubles, or both");const ordered=["singles","doubles"].filter(value=>categories.includes(value));await saveCategories(slug,ordered);return{sport:slug,activeCategories:ordered,mode:ordered.length===2?"both":ordered[0]}}
