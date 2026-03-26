import { put, del } from "@vercel/blob";

export async function uploadToBlob(
  filename: string,
  file: Buffer
): Promise<string> {
  const blob = await put(filename, file, { access: "public" });
  return blob.url;
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}
