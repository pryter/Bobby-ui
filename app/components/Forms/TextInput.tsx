import type { FC } from "react"

interface TextInputProps {
  type?: "email" | "number" | "password" | "text"
  placeholder: string
}
export const TextInput: FC<TextInputProps> = ({
  type = "text",
  placeholder
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-gray-900 bg-gray-100 px-4"
    />
  )
}
