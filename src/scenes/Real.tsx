import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { IVORY, DISPLAY, SANS, eased, popped } from "../look";
import { SceneProps, num, str } from "./types";

// A real picture of the story's subject (ali, 20 Nov 2026: "include images from online of the subjects"): the actual jewel,
// the person, the shop, from Wikimedia Commons or the Met's Open Access, found and license-checked by scripts/fetch_images.py.
// The file lives in public/img. Options:
//   src     the file name in public/img
//   fit     "card" (default): the whole picture on a blurred copy of itself, slowly pushing in;
//           "cover": the picture fills the frame, cropped around `focus`
//   focus   {x, y, k}: the point of the picture (0 to 1 across and down) the crop and the push-in go to; k is the push (default 1.12)
//   label   an ivory line above the picture ("The Hope Diamond"), left out on the first scene
//   credit  the line at the bottom ("Photo: Name, CC BY 4.0"); required by check.py for every picture whose license asks for it
// It works the same in every look: a photograph is a photograph.
export const Real: React.FC<SceneProps> = ({ t, dur, p, hook }) => {
  const src = str(p.src, "");
  const fit = str(p.fit, "card");
  const focus = (p.focus ?? {}) as { x?: number; y?: number; k?: number };
  const fx = num(focus.x, 0.5);
  const fy = num(focus.y, 0.5);
  const zoom = 1 + (num(focus.k, 1.12) - 1) * eased(t, 0, Math.max(1.6, dur));
  const credit = str(p.credit, "");
  const label = hook ? "" : str(p.label, "");
  const a = hook ? 1 : popped(t, 0, 0.3);
  const file = staticFile(`img/${src}`);
  return (
    <AbsoluteFill style={{ background: "#07090f" }}>
      {fit === "cover" ? (
        <Img src={file} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, transform: `scale(${zoom})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, opacity: a }} />
      ) : (
        <>
          <Img src={file} style={{ position: "absolute", inset: -120, width: 1320, height: 2160, objectFit: "cover", filter: "blur(46px) brightness(0.5) saturate(1.25)", opacity: a }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: hook ? 580 : 340, paddingBottom: 770, opacity: a }}>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.35)", lineHeight: 0 }}>
              <Img src={file} style={{ display: "block", maxWidth: 980, maxHeight: hook ? 570 : 800, objectFit: "contain", transform: `scale(${zoom})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }} />
            </div>
          </AbsoluteFill>
        </>
      )}
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(4,6,12,0.62) 0%, rgba(4,6,12,0) 26%, rgba(4,6,12,0) 58%, rgba(4,6,12,0.78) 100%)" }} />
      {label && (
        <div style={{ position: "absolute", top: 250, left: 0, width: 1080, textAlign: "center", fontFamily: DISPLAY, fontStyle: "italic", fontSize: 58, color: IVORY, textShadow: "0 2px 14px rgba(0,0,0,0.85)", opacity: eased(t, 0.1, 0.5) }}>{label}</div>
      )}
      {credit && (
        <div style={{ position: "absolute", bottom: 96, left: 60, width: 960, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 25, color: "rgba(255,255,255,0.78)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{credit}</div>
      )}
    </AbsoluteFill>
  );
};
