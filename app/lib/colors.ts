// eslint-disable-next-line import/no-extraneous-dependencies
import colors from "tailwindcss/colors"

export const getAllColorsName = (): string[] => {
  const col: string[] = []
  // eslint-disable-next-line no-restricted-syntax
  for (const [n, c] of Object.entries(colors)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const num of Object.keys(c)) {
      col.push(`${n}-${num}`)
    }
  }

  return col
}
