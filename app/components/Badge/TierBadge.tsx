import classnames from "classnames"
import type { FC } from "react"

const ClassVariants = {
  pro: "bg-cyan-600 border-cyan-100 text-white",
  free: "bg-white border-gray-900 text-gray-900"
}

const TaglineVariants = {
  pro: "Pro",
  free: "Free"
}
interface TierBadgeProps {
  variant?: "pro" | "free"
}

export const TierBadge: FC<TierBadgeProps> = ({ variant = "pro" }) => {
  return (
    <span
      className={classnames(
        "ml-2 mt-0.5 rounded-full border bg-opacity-90 px-2.5 py-0.5 text-center text-[10px] font-medium leading-[12px]",
        ClassVariants[variant]
      )}
    >
      {TaglineVariants[variant]}
    </span>
  )
}
