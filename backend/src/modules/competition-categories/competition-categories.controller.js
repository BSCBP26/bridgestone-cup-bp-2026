import{getCategories,updateCategories}from'./competition-categories.service.js';
export async function getCompetitionCategories(req,res,next){try{res.json({success:true,data:await getCategories(req.params.slug)})}catch(error){next(error)}}
export async function putCompetitionCategories(req,res,next){try{res.json({success:true,data:await updateCategories(req.params.slug,req.body?.activeCategories)})}catch(error){next(error)}}
