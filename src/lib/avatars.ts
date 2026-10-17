import a1 from "@/assets/avatar-a1.png";
import a2 from "@/assets/avatar-a2.png";
import tutor from "@/assets/avatar-tutor.png";

export const AVATARS: Record<string, string> = { a1, a2, a3: tutor };
export const TUTOR = tutor;
export const avatarSrc = (k?: string | null) => AVATARS[k ?? "a1"] ?? a1;
