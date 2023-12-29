import type { Variants } from "framer-motion"
import { motion, useAnimationControls } from "framer-motion"
import type { FC } from "react"
import { useEffect, useState } from "react"

import type { TextInputProps } from "@/components/Forms/TextInput"

interface AnimatedTextInputProps extends TextInputProps {}

const slabVariants: Variants = {
  focus: {
    width: "100%"
  },
  blur: {
    width: "0"
  }
}

const titleVariants: Variants = {
  focus: {
    y: 0,
    fontSize: "14px",
    fontWeight: "500"
  },
  blur: { y: 19, fontSize: "16px", fontWeight: "400" }
}
export const AnimatedTextInput: FC<AnimatedTextInputProps> = (props) => {
  const { title, type = "text", placeholder = "" } = props

  const [isFocus, setFocus] = useState(false)
  const [isTyping, setTyping] = useState(false)
  const controls = useAnimationControls()

  useEffect(() => {
    if (isFocus) {
      controls.start("focus")
    } else {
      controls.start("blur")
    }
  }, [isFocus])

  useEffect(() => {
    if (isTyping) {
      controls.start("focus", { delay: 0, duration: 0.1 })
    }
  }, [isTyping])
  return (
    <div className="relative h-10 w-full rounded-lg border border-gray-900 bg-white">
      <motion.h2
        variants={titleVariants}
        initial={"blur"}
        animate={controls}
        transition={{ delay: 0.4 }}
        className="absolute -top-[11px] left-3 z-[1] bg-white px-1 text-sm font-medium"
      >
        {title}
      </motion.h2>
      <div className="absolute -top-1 left-3 z-0 h-1">
        <motion.div
          variants={slabVariants}
          initial={"blur"}
          animate={isFocus ? "focus" : "blur"}
          transition={{ delay: isFocus ? 0 : 0.8 }}
          className="top-0 h-1 w-full bg-white"
        />
        <h2 className="bg-white px-1 text-sm font-medium opacity-0">{title}</h2>
      </div>
      <input
        onFocus={() => {
          setFocus(true)
        }}
        onBlur={(e) => {
          if (!e.target.value) {
            setFocus(false)
          }
          setTyping(false)
        }}
        onKeyDown={() => {
          setTyping(true)
        }}
        type={type}
        className="relative z-[2] h-full w-full rounded-lg bg-white bg-opacity-0 px-4 outline-none"
      />
    </div>
  )
}
