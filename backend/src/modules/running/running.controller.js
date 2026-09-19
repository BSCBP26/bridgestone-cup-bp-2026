import { getRunningDashboard, importRunningWorkbook } from "./running.service.js";
export async function getDashboard(req, res, next) { try { res.json({ success: true, data: await getRunningDashboard(req.query) }); } catch (error) { next(error); } }
export async function importWorkbook(req, res, next) { try { res.status(201).json({ success: true, data: await importRunningWorkbook(req.body?.fileBase64) }); } catch (error) { next(error); } }
