import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

// Notionists by Zoish (CC0). Hair sets picked by hand: long styles and hijabs for women, short styles for men.
// Rendered on the server at /avatar/v1/<gender>/<seed>.svg and cached by the browser, so pages stay small.
const HAIR_F = [2, 4, 8, 10, 23, 28, 36, 37, 39, 41, 43, 45, 46, 47, 58, 62, 63, 62, 63, 62, 63];
const HAIR_M = [1, 5, 6, 7, 9, 12, 13, 15, 16, 17, 18, 19, 21, 22, 24, 25, 27, 30, 31, 33, 34, 35, 38, 44, 49, 52, 53, 54, 55, 56];
const BG = ["cdeee2", "dbe7ff", "ffe7c2", "ffdfe6", "e6defd", "d5effb", "efe6d6"];
const v = (n: number) => `variant${String(n).padStart(2, "0")}`;

export function avatarSvg(seed: string, gender = ""): string {
  const hair = (gender === "f" ? HAIR_F : gender === "m" ? HAIR_M : [...HAIR_F, ...HAIR_M]).map(v);
  return createAvatar(notionists, {
    seed, hair: hair as never, backgroundColor: BG, radius: 50,
    beardProbability: gender === "m" ? 30 : 0, glassesProbability: 18, gestureProbability: 0, bodyIconProbability: 0,
  }).toString();
}
