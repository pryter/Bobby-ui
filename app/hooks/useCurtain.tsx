import type { Dispatch } from "react"
import { useState } from "react"

export const useCurtain = (): [Dispatch<boolean>, JSX.Element] => {
  const [loading, setLoading] = useState(false)
  const curtain = loading ? <div className="curtain" /> : <></>

  return [setLoading, curtain]
}
