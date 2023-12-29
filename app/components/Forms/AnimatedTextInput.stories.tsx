import type { Meta, StoryObj } from "@storybook/react"

import { AnimatedTextInput } from "@/components/Forms/AnimatedTextInput"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Forms/AnimatedTextInput",
  component: AnimatedTextInput,
  parameters: {
    layout: "centered"
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"]
} satisfies Meta<typeof AnimatedTextInput>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    type: "text",
    placeholder: "placeholder",
    title: "title"
  }
}
