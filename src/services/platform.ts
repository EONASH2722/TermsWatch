import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export const isAndroid = () => Capacitor.getPlatform() === 'android';
export interface SharedFile { name: string; mimeType: string; base64: string }
export interface SharedPayload { text?: string; files?: SharedFile[]; error?: string }
interface ShareInboxPlugin {
  consume(): Promise<SharedPayload>;
  fetchPage(options: { url: string }): Promise<{ html: string; url: string }>;
  addListener(event: 'shareReceived', listener: () => void): Promise<PluginListenerHandle>;
}
export const ShareInbox = registerPlugin<ShareInboxPlugin>('ShareInbox');

export function sharedFileToFile(file: SharedFile): File {
  const binary = atob(file.base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], file.name, { type: file.mimeType });
}

export async function captureDocumentImage(): Promise<File> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const photo = await Camera.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.Uri, quality: 90, width: 2200, correctOrientation: true, saveToGallery: false });
  if (!photo.webPath) throw new Error('The camera did not return an image.');
  const response = await fetch(photo.webPath);
  if (!response.ok) throw new Error('The captured image could not be opened.');
  return new File([await response.blob()], `captured-${Date.now()}.${photo.format}`, { type: `image/${photo.format}` });
}
