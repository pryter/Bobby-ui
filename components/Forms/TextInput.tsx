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
  return (<div>
      <h2 className="text-xs mb-1">
        {title}
      </h2>
      <div className="relative h-11 w-full rounded-lg border border-gray-300 bg-gray-100
                    dark:border-white/10 dark:bg-white/[0.04]
                    focus-within:border-gray-900 dark:focus-within:border-bobby-lime/60
                    transition-colors">
        <input
          type={type}
          placeholder={placeholder}
          className="h-full w-full rounded-lg bg-transparent px-4 text-sm outline-none
                   text-gray-900 placeholder-gray-400
                   dark:text-white dark:placeholder-gray-500"
        />
      </div></div>
  )
}
