import { KreativeItem } from "../types";

const BASE_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

/**
 * Custom error class for API call failures
 */
export class DriveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
  }
}

/**
 * Standard fetch helper with authorization
 */
async function driveFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    throw new DriveApiError("Ogiltig eller utgången OAuth-token. Logga in igen.", 401);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Okänt fel");
    throw new DriveApiError(
      `Fel vid Drive API-anrop: ${response.statusText} (${errorText})`,
      response.status
    );
  }

  return response;
}

/**
 * Find or create the dedicated folder for KREATIVE files
 */
export async function getOrCreateKreativeFolder(token: string): Promise<string> {
  const folderName = "KREATIVE Workspace";
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
  );
  
  const searchUrl = `${BASE_URL}/files?q=${query}&fields=files(id,name)`;
  const searchResponse = await driveFetch(searchUrl, token);
  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Folder does not exist, create it
  const createResponse = await driveFetch(`${BASE_URL}/files`, token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  const folderData = await createResponse.json();
  return folderData.id;
}

/**
 * List all .kreative files in the workspace folder
 */
export async function listKreativeFiles(
  token: string,
  folderId: string
): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const listUrl = `${BASE_URL}/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;
  
  const response = await driveFetch(listUrl, token);
  const data = await response.json();
  
  return (data.files || []).filter((file: any) => file.name.endsWith(".kreative"));
}

/**
 * Download a file content by Google Drive file ID
 */
export async function downloadKreativeFile(token: string, fileId: string): Promise<KreativeItem> {
  const downloadUrl = `${BASE_URL}/files/${fileId}?alt=media`;
  const response = await driveFetch(downloadUrl, token);
  const item: KreativeItem = await response.json();
  
  // Make sure we carry the driveFileId with it
  return {
    ...item,
    id: fileId, // Use drive fileId as the item id to make tracking seamless
    driveFileId: fileId,
  };
}

/**
 * Create a new file in Google Drive under the workspace folder
 */
export async function createKreativeFile(
  token: string,
  folderId: string,
  item: KreativeItem
): Promise<string> {
  // 1. Create file metadata
  const metadataUrl = `${BASE_URL}/files`;
  const metadataResponse = await driveFetch(metadataUrl, token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${item.name}.kreative`,
      parents: [folderId],
      mimeType: "application/json",
    }),
  });

  const metadata = await metadataResponse.json();
  const fileId = metadata.id;

  // 2. Upload actual content
  const contentItem: KreativeItem = {
    ...item,
    id: fileId,
    driveFileId: fileId,
  };

  const uploadUrl = `${UPLOAD_URL}/files/${fileId}?uploadType=media`;
  await driveFetch(uploadUrl, token, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contentItem),
  });

  return fileId;
}

/**
 * Save an existing file's updated content in Google Drive
 */
export async function updateKreativeFile(
  token: string,
  fileId: string,
  item: KreativeItem
): Promise<void> {
  // First, update the metadata if the name changed
  const metadataUrl = `${BASE_URL}/files/${fileId}`;
  await driveFetch(metadataUrl, token, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${item.name}.kreative`,
    }),
  });

  // Then, update the content (media)
  const contentItem: KreativeItem = {
    ...item,
    id: fileId,
    driveFileId: fileId,
  };

  const uploadUrl = `${UPLOAD_URL}/files/${fileId}?uploadType=media`;
  await driveFetch(uploadUrl, token, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contentItem),
  });
}

/**
 * Delete a file from Google Drive
 */
export async function deleteKreativeFile(token: string, fileId: string): Promise<void> {
  const deleteUrl = `${BASE_URL}/files/${fileId}`;
  await driveFetch(deleteUrl, token, {
    method: "DELETE",
  });
}
