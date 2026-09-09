const isNamespaceMap = function (option) {
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    return false
  }
  const proto = Object.getPrototypeOf(option)
  if (proto !== Object.prototype && proto !== null) {
    return false
  }
  return Object.entries(option).every(([namespace, included]) => {
    return /^-?\d+$/.test(namespace) && typeof included === 'boolean'
  })
}

const validNamespace = function (option) {
  return option === null || typeof option === 'boolean' || Number.isInteger(option) || isNamespaceMap(option)
}

const keepNamespace = function (namespace, option) {
  if (option === null || option === true) {
    return true
  }
  if (option === false) {
    return false
  }
  if (typeof option === 'number') {
    return namespace === option
  }
  return option[namespace] === true
}

export { keepNamespace, validNamespace }
