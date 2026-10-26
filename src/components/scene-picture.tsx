import { LoopClip } from "@/components/loop-clip";
import type { ScenePic } from "@/lib/scene-images";

/** A page's header picture, as on the role pages: full width, a slow drift or its animated loop, marked as an AI illustration. */
export function ScenePicture({ pic }: { pic: ScenePic }) {
  return (
    <div className="flare relative overflow-hidden bg-navy">
      <img src={pic.src} alt={pic.alt} width={1280} height={720} className="kenburns img-in block aspect-video w-full object-cover outline-none" />
      {pic.video ? <LoopClip key={pic.video} src={pic.video} /> : null}
      <p className="absolute right-2 top-2 z-[1] rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">AI-generated illustration</p>
    </div>
  );
}
