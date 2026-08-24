import { AppError } from "../../shared/app-error.js";
import { createAnnouncement,deleteAnnouncement,listAnnouncements,updateAnnouncement } from "./announcements.service.js";
function validate(body){if(!body||typeof body.titleId!=="string"||!body.titleId.trim())throw new AppError(422,"titleId is required");if(typeof body.bodyId!=="string"||!body.bodyId.trim())throw new AppError(422,"bodyId is required");if(body.status&&!["draft","published","archived"].includes(body.status))throw new AppError(422,"Invalid announcement status");return body}
export async function getPublicAnnouncements(_req,res,next){try{const data=await listAnnouncements();res.json({success:true,data,meta:{total:data.length,visibility:"published"}})}catch(error){next(error)}}
export async function getAdminAnnouncements(_req,res,next){try{const data=await listAnnouncements({includeUnpublished:true});res.json({success:true,data,meta:{total:data.length}})}catch(error){next(error)}}
export async function postAnnouncement(req,res,next){try{res.status(201).json({success:true,data:await createAnnouncement(validate(req.body),req.admin.id)})}catch(error){next(error)}}
export async function putAnnouncement(req,res,next){try{res.json({success:true,data:await updateAnnouncement(req.params.id,validate(req.body))})}catch(error){next(error)}}
export async function removeAnnouncement(req,res,next){try{res.json({success:true,data:await deleteAnnouncement(req.params.id)})}catch(error){next(error)}}
