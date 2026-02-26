import { ArrowRight, Repeat, Repeat1, Shuffle } from "lucide-react";
import type { PlayOrder } from "@/store/usePlayerStore";

export const playOrderIcons: Record<PlayOrder, typeof Shuffle> = {
  sequential: ArrowRight,
  shuffle: Shuffle,
  repeat: Repeat,
  "repeat-one": Repeat1,
};
