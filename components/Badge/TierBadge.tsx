import classnames from "classnames"
import type { FC } from "react"

const ClassVariants = {
  pro: "bg-bobby-lime/90 border-bobby-lime/60 text-black",
  free: "bg-gray-100 border-gray-300 text-gray-700 dark:bg-white/[0.06] dark:border-white/[0.12] dark:text-gray-300",
}

const TaglineVariants = {
  pro: "Pro",
  free: "Free",
}

interface TierBadgeProps {
  variant?: "pro" | "free"
}

export const TierBadge: FC<TierBadgeProps> = ({ variant = "pro" }) => {
  return (
    <span
      className={classnames(
        "rounded-full border px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider leading-none",
        ClassVariants[variant]
      )}
    >
      {TaglineVariants[variant]}
    </span>
  )
}
