const _typeof = {
  string: isString,
  number: isNumber,
  boolean: isBoolean,
  null: isNull,
  integer: isInteger,
  decimal: isDecimal,
  array: isArray,
  object: isObject
}

function isTypeof(type, value) {
  if (isUndefined(_typeof[type])) return undefined
  return _typeof[type](value)
}

function isString(value) {
  return typeof value === 'string'
}
function isBoolean(value) {
  return typeof value === 'boolean'
}

function isNumber(value) {
  return typeof value === 'number'
}

function isDecimal(value) {
  return !Number.isInteger(value)
}

function isInteger(value) {
  return Number.isInteger(value)
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isArray(value) {
  return Array.isArray(value)
}

function isFunc(value) {
  return typeof value === 'function'
}

function isUndefined(value) {
  return value === undefined
}

function isNull(value) {
  return value === null
}

export {
  isTypeof,
  isString,
  isBoolean,
  isNumber,
  isDecimal,
  isInteger,
  isObject,
  isArray,
  isFunc,
  isUndefined,
  isNull
}

export default _typeof
