import type { StorybookConfig } from "@storybook/react-vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { mergeConfig } from "vite"

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../app/components/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  docs: {
    autodocs: "tag"
  },
  viteFinal(config, { configType }) {
    return mergeConfig(config, {
      plugins: [
        tsconfigPaths()
      ]
    })
  }
}
export default config
