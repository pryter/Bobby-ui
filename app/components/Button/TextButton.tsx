import type { FC, ForwardRefExoticComponent, SVGProps } from "react"

interface TextButtonProps {
  content: {
    text: string
    HeroIcon?: ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref">>
  }
  onClick?: () => void
  variant?: "default" | "float-left" | "float-right" | "reverse"
  bgColor?: string
  fgColor?: string
}
export const TextButton: FC<TextButtonProps> = ({
  content,
  onClick = () => {},
  variant = "default",
  bgColor = "rgb(17 24 39)",
  fgColor = "#fff"
}) => {
  let Icon: FC<any> = () => {
    return <></>
  }

  if (content.HeroIcon) {
    Icon = content.HeroIcon
  }

  switch (variant) {
    case "float-left":
      return (
        <button
          onClick={onClick}
          style={{ backgroundColor: bgColor, color: fgColor }}
          className="relative mt-4 w-full items-center space-x-3 rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm"
        >
          <div className="absolute left-3 top-0 flex h-full items-center">
            <Icon className="h-5 w-5" />
          </div>
          <h2>{content.text}</h2>
        </button>
      )
    case "float-right":
      return (
        <button
          onClick={onClick}
          style={{ backgroundColor: bgColor, color: fgColor }}
          className="relative mt-4 w-full items-center rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm"
        >
          <h2 className="mr-3">{content.text}</h2>
          <div className="absolute right-3 top-0 flex h-full items-center">
            <Icon className="h-5 w-5" />
          </div>
        </button>
      )
    case "reverse":
      return (
        <button
          onClick={onClick}
          style={{ backgroundColor: bgColor, color: fgColor }}
          className="mt-4 flex w-full justify-center items-center space-x-2 rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm"
        >
          <h2>{content.text}</h2>
          <Icon className="h-5 w-5" />
        </button>
      )
    case "default":
      return (
        <button
          onClick={onClick}
          style={{ backgroundColor: bgColor, color: fgColor }}
          className="mt-4 flex w-full justify-center items-center space-x-2 rounded-lg bg-gray-900 px-14 py-2 font-medium text-white shadow-sm"
        >
          <Icon className="h-5 w-5" />
          <h2>{content.text}</h2>
        </button>
      )
    default:
      return <h1>Invalid variant</h1>
  }
}
