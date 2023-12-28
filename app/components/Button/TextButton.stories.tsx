import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HeartIcon
} from "@heroicons/react/24/solid"
import type { Meta, StoryObj } from "@storybook/react"

import { TextButton } from "@/components/Button/TextButton"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Buttons/TextButton",
  component: TextButton,
  parameters: {
    layout: "centered"
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  args: {
    content: {
      text: "Submit me"
    },
    onClick: () => {}
  },
  argTypes: {
    content: {
      description: "HeroIcon as a HeroIcon Element Type"
    },
    bgColor: {
      control: "color"
    },
    fgColor: {
      control: "color"
    }
  }
} satisfies Meta<typeof TextButton>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {}

export const DefaultWithIcon: Story = {
  args: { content: { text: "Click Me", HeroIcon: HeartIcon } }
}
export const Reverse: Story = {
  args: {
    variant: "reverse",
    content: { text: "Click Me", HeroIcon: HeartIcon }
  }
}
export const FloatLeft: Story = {
  args: {
    variant: "float-left",
    content: { text: "Go Back", HeroIcon: ArrowLeftIcon }
  }
}
export const FloatRight: Story = {
  args: {
    variant: "float-right",
    content: { text: "Next Page", HeroIcon: ArrowRightIcon }
  }
}
