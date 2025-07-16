function dotAccess(obj, path) {
  if (path.includes('.')) {
    // Si no existe el valor sera undifined y no causara error
    return path.split('.').reduce((acc, path) => {
      return acc?.[path]
    }, obj)
  }
  return obj[path]
}

export { dotAccess }
