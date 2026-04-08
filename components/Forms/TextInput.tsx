import type { FC } from "react"

export interface TextInputProps {
  type?: "email" | "number" | "password" | "text"
  placeholder?: string
  title: string
}

export const TextInput: FC<TextInputProps> = ({
  type = "text",
  placeholder = "",
  title,
}) => {
  return (
    <div className="relative h-11 w-full rounded-lg border border-gray-300 bg-gray-100
                    dark:border-white/10 dark:bg-white/[0.04]
                    focus-within:border-gray-900 dark:focus-within:border-bobby-lime/60
                    transition-colors">
      <h2 className="absolute -top-2.5 left-3 px-1 text-[11px] font-semibold tracking-wide uppercase
                     bg-white text-gray-700
                     dark:bg-bobby-bg dark:text-gray-300">
        {title}
      </h2>
      <input
        type={type}
        placeholder={placeholder}
        className="h-full w-full rounded-lg bg-transparent px-4 text-sm outline-none
                   text-gray-900 placeholder-gray-400
                   dark:text-white dark:placeholder-gray-500"
      />
    </div>
  )
}
