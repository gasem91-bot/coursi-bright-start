/**
 * Small runtime bridge so the portal behaves correctly in three contexts:
 *  - a normal desktop/mobile browser
 *  - an installed PWA
 *  - the Capacitor native shell (iOS / Android webview)
 *
 * Every Capacitor module is imported lazily and only when actually running
 * natively, so the web build never loads native code and keeps working
 * exactly as before.
 */

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/**
 * Opens an external link (Telegram, coursi.ai, …).
 * In the browser this is a plain new tab. Inside the native shell,
 * `target="_blank"` is unreliable, so we hand the URL to the system:
 * Custom Tabs / SFSafariViewController pass t.me links to the Telegram app.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch {
      /* fall through to the web behaviour */
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Saves a generated file. Browsers get the usual download anchor;
 * the native shell writes the file to app storage and opens the share
 * sheet (Save to Files / Photos / Print / send anywhere).
 */
export async function saveFile(params: {
  fileName: string;
  /** data: URL produced by canvas.toDataURL() */
  dataUrl: string;
  title?: string;
}): Promise<void> {
  const { fileName, dataUrl, title } = params;

  if (isNative()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: title ?? fileName, files: [uri] });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
