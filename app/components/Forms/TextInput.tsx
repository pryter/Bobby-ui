import type { FC } from "react"

interface TextInputProps {
  type?: "email" | "number" | "password" | "text"
  placeholder: string
  title: string
}
export const TextInput: FC<TextInputProps> = ({
  type = "text",
  placeholder,
    title
}) => {
  return (
    <div className="h-10 relative w-full rounded-lg border border-gray-900 bg-gray-100">
      <h2 className="absolute left-3 px-1 -top-2.5 text-sm bg-white font-medium">{title}</h2>
      <input
          type={type}
          placeholder={placeholder}
          className="h-full w-full rounded-lg px-4"
      />
    </div>
  )
}
