import { publicAsset } from "@/lib/publicAsset";
import { cn } from "@/lib/utils";

type LogoProps = { tone?: "light" | "dark"; className?: string };

// tone="light" is the white mark for ink surfaces; "dark" is the ink mark for light ones.
function Logo({ tone = "light", className }: LogoProps) {
  const src = tone === "light" ? "images/logo-mark-white.png" : "images/logo-mark.png";
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <img src={publicAsset(src)} alt="" width={44} height={44} className="size-11" />
      <span className="text-[0.9375rem] leading-[1.08] font-extrabold tracking-[0.04em] uppercase [font-stretch:108%]">
        Asiatic
        <br />
        Engineering Co.
      </span>
    </span>
  );
}

export default Logo;
