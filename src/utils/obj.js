function dotAccess(obj, path) {
  if (path.includes('.')) {
    // Si no existe el valor sera undifined y no causara error
    return dotSplit(path).reduce((acc, path) => {
      return acc?.[path]
    }, obj)
  }
  return obj[path]
}

// syntax
// obj.path
// obj.path.property
// obj.path[property.sub]
// obj.path.[property.sub]
// obj.path[property].sub
// obj.path[property][sub]

function dotSplit(path) {
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

export { dotAccess, dotSplit }
