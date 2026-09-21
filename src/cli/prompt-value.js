// Keep coercion and validation independent of terminal input and React state.
export function promptValue(param, input, initial) {
  let value = input
  if (param.type !== 'select' && param.type !== 'boolean') {
    if (param.type === 'number' && input === '') value = initial
    else if (param.parse) value = param.parse(input)
    else if (param.type === 'number') value = Number(input)
  }
  if (param.type === 'number' && value != null && !Number.isFinite(value)) {
    throw new Error('must be a number')
  }
  if (param.required && (value == null || value === '')) throw new Error('a value is required')
  const error = param.validate?.(value)
  if (error) throw new Error(error)
  return value
}
