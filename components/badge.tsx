import { clsx } from "clsx";

type BadgeTone = "blue" | "green" | "amber" | "red" | "purple" | "gray";

export function Badge({
  children,
  tone = "gray"
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={clsx("badge", tone)}>{children}</span>;
}
