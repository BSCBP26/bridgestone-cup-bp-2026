import { getStorageUsage } from "./storage-usage.service.js";

export async function getAdminStorageUsage(_request, response) {
  response.status(200).json({ success: true, data: await getStorageUsage() });
}
