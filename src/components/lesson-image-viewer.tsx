import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";

type Media = { src: string; alt: string };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

// Covers both chapter artwork and images in existing lesson HTML, without altering lesson data.
export function LessonImageViewer({ children, contentKey }: { children: ReactNode; contentKey: string }) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [media, setMedia] = useState<Media | null>(null);
  const [slots, setSlots] = useState<{ slot: HTMLElement; image: HTMLImageElement }[]>([]);
  const [rotate, setRotate] = useState(false);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const entries = Array.from(container.querySelectorAll("img")).map((image) => {
      const wrapper = document.createElement("span");
      wrapper.className = "lesson-image-target";
      image.before(wrapper);
      wrapper.append(image);
      const slot = document.createElement("span");
      slot.className = "lesson-image-expand";
      wrapper.append(slot);
      return { slot, image, wrapper };
    });
    setSlots(entries);
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      setMedia({ src: event.target.currentSrc || event.target.src, alt: event.target.alt });
    };
    container.addEventListener("click", onClick);
    return () => {
      container.removeEventListener("click", onClick);
      entries.forEach(({ image, wrapper }) => {
        if (wrapper.parentNode) { wrapper.before(image); wrapper.remove(); }
      });
    };
  }, [contentKey]);

  useEffect(() => {
    if (!media) return;
    const activeDialog = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    activeDialog?.showModal();
    let cancelled = false;
    let locked = false;
    const portrait = window.matchMedia("(orientation: portrait)");
    const mobile = window.matchMedia("(pointer: coarse)");
    const update = () => setRotate(mobile.matches && portrait.matches && !locked);
    update();
    const orientation = screen.orientation as LockableOrientation | undefined;
    if (mobile.matches && orientation?.lock) {
      orientation.lock("landscape").then(() => {
        if (cancelled) { orientation.unlock(); return; }
        locked = true;
        update();
      }).catch(() => { if (!cancelled) update(); });
    }
    portrait.addEventListener("change", update);
    return () => {
      cancelled = true;
      portrait.removeEventListener("change", update);
      if (locked) orientation?.unlock();
      document.body.style.overflow = previousOverflow;
      activeDialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [media]);

  return <div ref={root}>
    {children}
    {slots.map(({ slot, image }, index) => createPortal(
      <Button variant="ghost" size="icon" className="lesson-expand-button" aria-label={`تكبير الصورة: ${image.alt}`} title="تكبير الصورة"
        onClick={() => setMedia({ src: image.currentSrc || image.src, alt: image.alt })}><Expand size={17} /></Button>, slot, `${contentKey}-${index}`,
    ))}
    {media && createPortal(
      <dialog ref={dialog} className="lesson-viewer" aria-label={media.alt || "عارض صورة الدرس"} onCancel={() => setMedia(null)}>
        <TransformWrapper key={media.src} minScale={1} maxScale={6} centerOnInit wheel={{ step: 0.15 }}>
          {({ zoomIn, zoomOut }) => <>
            <div className="lesson-viewer-controls">
              <Button variant="ghost" size="icon" aria-label="إغلاق الصورة" title="إغلاق" onClick={() => setMedia(null)}><X /></Button>
              <Button variant="ghost" size="icon" aria-label="تكبير" title="تكبير" onClick={() => zoomIn()}><ZoomIn /></Button>
              <Button variant="ghost" size="icon" aria-label="تصغير" title="تصغير" onClick={() => zoomOut()}><ZoomOut /></Button>
            </div>
            <div className={`lesson-viewer-stage${rotate ? " is-rotated" : ""}`} data-landscape-fallback={rotate}>
              <TransformComponent wrapperClass="lesson-zoom-wrapper" contentClass="lesson-zoom-content">
                <img src={media.src} alt={media.alt} className="lesson-full-image" draggable={false} />
              </TransformComponent>
            </div>
          </>}
        </TransformWrapper>
      </dialog>, document.body,
    )}
  </div>;
}