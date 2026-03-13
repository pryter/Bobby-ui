import { NodeType } from "@/lib/pipeline"
import {
  CodeBracketIcon,
  CommandLineIcon,
  ArchiveBoxIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
} from "@heroicons/react/24/outline"
import type { ComponentType, SVGProps } from "react"

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export function nodeIcon(type: NodeType): IconComponent {
  switch (type) {
    case "git-clone":
      return CodeBracketIcon
    case "shell":
      return CommandLineIcon
    case "bun-install":
    case "bun-run":
    case "npm-install":
    case "npm-run":
    case "yarn-install":
    case "yarn-run":
      return WrenchScrewdriverIcon
    case "go-mod-download":
    case "go-build":
      return CubeIcon
    case "pack-artifact":
      return ArchiveBoxIcon
    case "upload-artifact":
      return CloudArrowUpIcon
    default:
      return ArrowDownTrayIcon
  }
}
