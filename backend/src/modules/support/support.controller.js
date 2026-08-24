import { AppError } from "../../shared/app-error.js";
import { buildSupportLeaderboard, createSupport, deleteSupport, listSupport, updateSupport } from "./support.service.js";

function validate(body) {
  if (!body || typeof body.author !== "string" || !body.author.trim()) throw new AppError(422, "author is required");
  if (typeof body.teamName !== "string" || body.teamName.trim().length < 2 || body.teamName.trim().length > 120) throw new AppError(422, "teamName must be between 2 and 120 characters");
  if (typeof body.messageId !== "string" || !body.messageId.trim()) throw new AppError(422, "messageId is required");
  if (body.photoStoragePath && !/^(?:r2\/)?support\/[a-f0-9-]+\.(jpg|png|webp)$/.test(body.photoStoragePath)) throw new AppError(422, "Invalid support photo path");
  if (body.status && !["draft", "published", "archived"].includes(body.status)) throw new AppError(422, "Invalid support status");
  if (body.sortOrder !== undefined && (!Number.isInteger(body.sortOrder) || body.sortOrder < 0)) throw new AppError(422, "sortOrder must be a non-negative integer");
  return body;
}

export async function getPublicSupport(_req, res, next) { try { const data = await listSupport(); res.json({ success: true, data, meta: { total: data.length, visibility: "published", leaderboard: buildSupportLeaderboard(data) } }); } catch (error) { next(error); } }
export async function getAdminSupport(_req, res, next) { try { const data = await listSupport({ includeUnpublished: true }); res.json({ success: true, data, meta: { total: data.length } }); } catch (error) { next(error); } }
export async function postSupport(req, res, next) { try { res.status(201).json({ success: true, data: await createSupport(validate(req.body), req.admin.id) }); } catch (error) { next(error); } }
export async function putSupport(req, res, next) { try { res.json({ success: true, data: await updateSupport(req.params.id, validate(req.body)) }); } catch (error) { next(error); } }
export async function removeSupport(req, res, next) { try { res.json({ success: true, data: await deleteSupport(req.params.id) }); } catch (error) { next(error); } }
