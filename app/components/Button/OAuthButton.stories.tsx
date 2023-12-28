import type { Meta, StoryObj } from "@storybook/react"

import { OAuthButton } from "@/components/Button/OAuthButton"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Buttons/OAuthButton",
  component: OAuthButton,
  parameters: {
    layout: "centered"
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  args: {
    onClick: () => {}
  },
  argTypes: {
    provider: {
      control: "select",
      options: ["google", "github"]
    }
  }
} satisfies Meta<typeof OAuthButton>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SigninWithGoogle: Story = {
  args: {
    provider: "google"
  }
}

export const SigninWithGithub: Story = {
  args: {
    provider: "github"
  }
}
