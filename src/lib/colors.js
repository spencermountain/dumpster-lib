// whether to emit ANSI color, honoring the usual standards:
//   FORCE_COLOR wins if set   (chalk convention: '0'/'false' = off, anything else = on)
//   NO_COLOR disables if set   (https://no-color.org - present, regardless of value)
//   otherwise, only when stdout is a TTY
const enabled = function () {
  const { FORCE_COLOR, NO_COLOR } = process.env
  if (FORCE_COLOR !== undefined) {
    return !(FORCE_COLOR === '0' || FORCE_COLOR === 'false')
  }
  if (NO_COLOR !== undefined) {
    return false
  }
  return Boolean(process.stdout.isTTY)
}

// wrap in an ANSI code, or pass the string through untouched when color is off
const paint = (code) => (str) => (enabled() ? '\x1b[' + code + 'm' + str + '\x1b[0m' : String(str))

const green = paint(32)
const red = paint(31)
const blue = paint(34)
const magenta = paint(35)
const cyan = paint(36)
const grey = paint(37)
const yellow = paint(33)
const black = paint(30)
const dim = paint(2)

export {
  enabled,
  green,
  red,
  blue,
  magenta,
  cyan,
  grey,
  yellow,
  black,
  dim,
}
