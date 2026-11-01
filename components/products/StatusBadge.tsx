import type { ProductStatus } from "@/lib/products"

const STYLE: Record<ProductStatus, { pill: string; dot: string }> = {
  Live: { pill: "bg-green-600/10 text-green-700 dark:bg-green-400/10 dark:text-green-400", dot: "bg-green-500" },
  Beta: { pill: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", dot: "bg-amber-500" },
  Archived: { pill: "bg-gray-500/10 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400", dot: "bg-gray-400" },
}

export default function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] " +
        STYLE[status].pill
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + STYLE[status].dot} />
      {status}
    </span>
  )
}
