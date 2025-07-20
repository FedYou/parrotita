import messages from './messages.json' assert { type: 'json' }
import _typeof, { isString } from './utils/typeof.js'

function join(message, values = {}) {
  let result = message

  for (const key in values) {
    result = result.replace(`$${key}`, values[key])
  }

  return result
}

function returnTypeValue(targetSchema) {
  return isString(targetSchema) ? targetSchema : targetSchema.type
}

function resolveUnexpectedKey(string) {
  if (string.includes('.')) {
    const split = string.split('.'),
      length = split.length,
      unexpectedKey = split[length - 1]

    return {
      path: string.replace(`.${unexpectedKey}`, ''),
      unexpectedKey: unexpectedKey
    }
  }
  return {
    path: '(root)',
    unexpectedKey: string
  }
}

class SchemaFactory {
  static typeof({ targetSchema, path }) {
    const type = isString(targetSchema) ? targetSchema : targetSchema.type
    const allowedTypes = Object.keys(_typeof).join(', ')
    return join(messages._invalidType, { path, type, allowedTypes })
  }
  static requireType({ path }) {
    return messages._requireType.replace('$path', path)
  }
  static properties({ path }) {
    return messages._properties.replace('$path', path)
  }
  static maxLength({ path }) {
    return join(messages._MaxMin, { type: 'maxLength', path })
  }
  static minLength({ path }) {
    return join(messages._MaxMin, { type: 'minLength', path })
  }
  static maxItems({ path }) {
    return join(messages._MaxMin, { type: 'maxItems', path })
  }
  static minItems({ path }) {
    return join(messages._MaxMin, { type: 'minItems', path })
  }
  static minItemsMinimum({ path }) {
    return join(messages._MinMinimum, { type: 'minItems', path })
  }
  static minLengthMinimum({ path }) {
    return join(messages._MinMinimum, { type: 'minLength', path })
  }
}

class DataFactory {
  static required({ path }) {
    return messages.required.replace('$path', path)
  }
  static typeof({ targetSchema, path }) {
    const type = returnTypeValue(targetSchema)
    return join(messages.typeof, { path, type })
  }
  static enum({ targetSchema, path }) {
    const enums = returnTypeValue(targetSchema)
    return join(messages.enum, { path, enums: enums.join(', ') })
  }
  static maxItems({ targetSchema: { maxItems }, path }) {
    return join(messages.maxItems, { path, maxItems })
  }
  static minItems({ targetSchema: { minItems }, path }) {
    return join(messages.minItems, { path, minItems })
  }
  static maxLength({ targetSchema: { maxLength }, path }) {
    return join(messages.maxLength, { path, maxLength })
  }
  static minLength({ targetSchema: { minLength }, path }) {
    return join(messages.minLength, { path, minLength })
  }
  static pattern({ targetSchema: { pattern }, path }) {
    return join(messages.pattern, { path, pattern })
  }
  static unexpectedKey({ path }) {
    return join(messages.unexpectedKey, resolveUnexpectedKey(path))
  }
  static minimum({ targetSchema: { minimum }, path }) {
    return join(messages.minimum, { path, minimum })
  }
  static maximum({ targetSchema: { maximum }, path }) {
    return join(messages.maximum, { path, maximum })
  }
  static exclusiveMinimum({ targetSchema: { exclusiveMinimum }, path }) {
    return join(messages.exclusiveMinimum, { path, exclusiveMinimum })
  }
  static exclusiveMaximum({ targetSchema: { exclusiveMaximum }, path }) {
    return join(messages.exclusiveMaximum, { path, exclusiveMaximum })
  }
}

class _Error extends Error {
  constructor(values) {
    super()
    for (const key in values) {
      this[key] = values[key]
    }
  }
}

function throwError({ schemaIssue = false, targetSchema = undefined, type, path }) {
  const values = {
    name: schemaIssue ? 'Schema' : 'Data',
    schemaIssue,
    title: targetSchema?.title ?? null,
    description: targetSchema?.description ?? null,
    examples: targetSchema?.examples ?? null,
    default: targetSchema?.default ?? null,
    type
  }

  const factory = schemaIssue ? SchemaFactory : DataFactory

  if (typeof factory[type] === 'function') {
    values.message = factory[type]({ targetSchema, path })

    throw new _Error(values)
  }
}

/**
 * @param {Object} options
 * @param {*} [options.targetSchema]
 * @param {"typeof" | "requireType" | "properties" | "maxLength" | "minLength, "maxItems" | "minItems" | "minItemsMinimum" | "minLengthMinimum" } [options.type]
 * @param {string} [options.path]
 */

function throwSchemaError({ targetSchema, path, type }) {
  throwError({ schemaIssue: true, targetSchema, path, type })
}

/**
 * @param {Object} options
 * @param {*} [options.targetSchema]
 * @param {"required" | "typeof" | "enum" | "maxItems" | "minItems" | "maxLength" | "minLength" | "pattern" | "unexpectedKey" | "minimum" | "maximum"  | "exclusiveMinimum" | "exclusiveMaximum" } [options.type]
 * @param {string} [options.path]
 */

function throwDataError({ targetSchema, path, type }) {
  throwError({ schemaIssue: false, targetSchema, path, type })
}
export { throwSchemaError, throwDataError }
export default { throwSchemaError, throwDataError }
