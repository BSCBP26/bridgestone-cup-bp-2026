import { AppError } from "../../shared/app-error.js";
import { createGreeting, deleteGreeting, listGreetings, updateGreeting } from "./greetings.service.js";

function validate(body) {
  if(!body || typeof body.name!=="string" || !body.name.trim()) throw new AppError(422,"name is required");
  if(typeof body.roleId!=="string" || !body.roleId.trim()) throw new AppError(422,"roleId is required");
  if(typeof body.messageId!=="string" || !body.messageId.trim()) throw new AppError(422,"messageId is required");
  if(body.photoStoragePath && !/^(?:r2\/)?greetings\/[a-f0-9-]+\.(jpg|png|webp)$/.test(body.photoStoragePath)) throw new AppError(422,"Invalid greeting photo path");
  if(body.status && !["draft","published","archived"].includes(body.status)) throw new AppError(422,"Invalid greeting status");
  if(body.sortOrder!==undefined && (!Number.isInteger(body.sortOrder)||body.sortOrder<0)) throw new AppError(422,"sortOrder must be a non-negative integer");
  return body;
}
export async function getPublicGreetings(_req,res,next){try{const data=await listGreetings();res.json({success:true,data,meta:{total:data.length,visibility:"published"}})}catch(error){next(error)}}
export async function getAdminGreetings(_req,res,next){try{const data=await listGreetings({includeUnpublished:true});res.json({success:true,data,meta:{total:data.length}})}catch(error){next(error)}}
export async function postGreeting(req,res,next){try{res.status(201).json({success:true,data:await createGreeting(validate(req.body),req.admin.id)})}catch(error){next(error)}}
export async function putGreeting(req,res,next){try{res.json({success:true,data:await updateGreeting(req.params.id,validate(req.body))})}catch(error){next(error)}}
export async function removeGreeting(req,res,next){try{res.json({success:true,data:await deleteGreeting(req.params.id)})}catch(error){next(error)}}
