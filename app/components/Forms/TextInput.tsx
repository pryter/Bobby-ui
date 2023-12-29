import type { FC } from "react"

export interface TextInputProps {
  type?: "email" | "number" | "password" | "text"
  placeholder?: string
  title: string
}
export const TextInput: FC<TextInputProps> = ({
  type = "text",
  placeholder = "",
  title
}) => {
  return (
    <div className="relative h-10 w-full rounded-lg border border-gray-900 bg-gray-100">
      <h2 className="absolute -top-2.5 left-3 bg-white px-1 text-sm font-medium">
        {title}
      </h2>
      <input
        type={type}
        placeholder={placeholder}
        className="h-full w-full rounded-lg px-4"
      />
    </div>
  )
}
