import { isArray, isInteger } from './typeof.js'
import { throwSchemaError } from '../error.js'

const DOT_PATH_REGEX = /^(\[\s*[^\[\]]+\s*\]|\w+)((\.(\w+)|\.\[\s*[^\[\]]+\s*\]|\[\s*[^\[\]]+\s*\]))*$/

function dotAccess(obj, path) {
  // Si no existe el valor sera undifined y no causara error
  return dotSplit(path).reduce((acc, path) => {
    return acc?.[path]
  }, obj)
}

// syntax
// obj.path
// obj.path.property
// obj.path[property.sub]
// obj.path.[property.sub]
// obj.path[property].sub
// obj.path[property][sub]

function dotSplit(path) {
  if (!DOT_PATH_REGEX.test(path)) {
    throwSchemaError({ type: 'invalidPath', path })
  }

  const keys = []
  const split = path.split('')

  let key = ''
  let useBrackets = false
  let isBracket = false
  let lastIsBracketEnd = false
  let lastIsBracketStart = false

  const pushKey = () => {
    if (key !== '') {
      keys.push(key)
      key = ''
    }
  }

  for (let index = 0; index < split.length; index++) {
    const char = split[index]

    if (char === '[') {
      if (useBrackets && lastIsBracketEnd) {
        pushKey()
      } else if (!useBrackets) {
        useBrackets = true
      }
      isBracket = true
    }

    if (char === ']' && useBrackets) {
      useBrackets = false
      isBracket = true
    }

    if ((char !== '.' || useBrackets) && !isBracket) {
      key += char
    }

    if (
      (char === '.' && !useBrackets) ||
      (index === split.length - 1 && key !== '') ||
      (lastIsBracketEnd && isBracket) ||
      (!lastIsBracketStart && !lastIsBracketEnd && isBracket)
    ) {
      pushKey()
    }

    if (!isBracket) continue

    if (char === '[') {
      lastIsBracketStart = true
    } else {
      lastIsBracketStart = false
    }
    if (char === ']') {
      lastIsBracketEnd = true
    } else {
      lastIsBracketEnd = false
    }

    isBracket = false
  }
  return keys
}

function serializeDotPath(path) {
  return path.reduce((acc, value) => {
    if (isInteger(value)) {
      return `${acc}[${value}]`
    }
    if (value.includes('.')) {
      return `${acc}["${value}"]`
    }

    return acc === '' ? value : `${acc}.${value}`
  }, '')
}

export { dotAccess, dotSplit, serializeDotPath }
