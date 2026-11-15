import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

// Notionists by Zoish (CC0). Hair sets picked by hand: long styles and hijabs for women, short styles for men.
const HAIR_F = [2, 4, 8, 10, 23, 28, 36, 37, 39, 41, 43, 45, 46, 47, 58, 62, 63, 62, 63, 62, 63];
const HAIR_M = [1, 5, 6, 7, 9, 12, 13, 15, 16, 17, 18, 19, 21, 22, 24, 25, 27, 30, 31, 33, 34, 35, 38, 44, 49, 52, 53, 54, 55, 56];
const BG = ["cdeee2", "dbe7ff", "ffe7c2", "ffdfe6", "e6defd", "d5effb", "efe6d6"];
const v = (n: number) => `variant${String(n).padStart(2, "0")}`;
const cache = new Map<string, string>();

export function avatarUri(seed: string, gender = ""): string {
  const key = `${gender}:${seed}`;
  let uri = cache.get(key);
  if (!uri) {
    const hair = (gender === "f" ? HAIR_F : gender === "m" ? HAIR_M : [...HAIR_F, ...HAIR_M]).map(v);
    uri = createAvatar(notionists, {
      seed, hair: hair as never, backgroundColor: BG, radius: 50,
      beardProbability: gender === "m" ? 30 : 0, glassesProbability: 18, gestureProbability: 0, bodyIconProbability: 0,
    }).toDataUri();
    cache.set(key, uri);
  }
  return uri;
}

/** A default profile picture: the same person always gets the same illustrated face. */
export function Avatar({ seed, gender, size = 40, className = "" }: { seed: string; gender?: string; size?: number; className?: string }) {
  return <img src={avatarUri(seed, gender)} width={size} height={size} alt="" className={`avatar ${className}`} loading="lazy" />;
}
