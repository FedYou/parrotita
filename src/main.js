import _typeof, {
  isArray,
  isFunc,
  isObject,
  isString,
  isNumber,
  isNull,
  isTypeof
} from './utils/typeof.js'
import { throwDataError, throwSchemaError } from './error.js'
import { dotAccess } from './utils/obj.js'

class UseIf {
  root
  targetSchema
  constructor({ root, ifRules, targetSchema }) {
    this.root = root
    this.targetSchema = targetSchema

    if (Array.isArray(ifRules)) {
      ifRules.if.forEach((ifSchema) => this.#evaluateIfBlock(ifSchema))
    } else if (isObject(ifRules)) {
      this.#evaluateIfBlock(ifRules)
    }
  }

  #evaluateIfBlock(ifRules) {
    if (!ifRules.value || !ifRules.conditions) return
    const fieldValue = dotAccess(this.root, ifRules.value)
    const conditionSet = ifRules.conditions

    if (Array.isArray(conditionSet)) {
      for (const condition of conditionSet) {
        this.#evaluateCondition(fieldValue, condition)
      }
    } else if (isObject(conditionSet)) {
      this.#evaluateCondition(fieldValue, conditionSet)
    }
  }

  #evaluateCondition(currentValue, condition) {
    if (!condition?.operator) return

    const op = condition.operator

    let matches = false

    const conditions = {
      '=': () => currentValue === condition.value,
      '!=': () => currentValue !== condition.value,
      '>': () => currentValue > condition.value,
      '<': () => currentValue < condition.value,
      '>=': () => currentValue >= condition.value,
      '<=': () => currentValue <= condition.value,
      typeof: () => isTypeof(condition.value, currentValue)
    }

    if (isFunc(conditions[op]) && conditions[op]()) {
      matches = true
    } else if (Array.isArray(condition.value) && new Set(condition.value).has(currentValue)) {
      matches = true
    }

    if (matches) {
      this.#mergeProperties(condition.addProperties)
      return
    }
    if (condition.elseIf) {
      this.#evaluateCondition(currentValue, condition.elseIf)
    } else if (condition.else) {
      this.#evaluateCondition(currentValue, condition.else)
    }
  }
  #mergeProperties(properties) {
    if (!isObject(properties)) return

    if (!this.targetSchema.properties || !isObject(this.targetSchema.properties)) {
      this.targetSchema.properties = {}
    }

    for (const key in properties) {
      // Se añadie las propiedades y sobreescribe si ya existen
      // targetSchema<KEY> = value (properties<KEY> = value)
      this.targetSchema.properties[key] = properties[key]
    }
  }
}

class Validator {
  #schema
  #root

  constructor(schema, root) {
    this.#schema = schema
    this.#root = root
    this.#init()
  }

  #init() {
    this.#validIf({ targetSchema: this.#schema, root: this.#root })
    this.#valid({ targetSchema: this.#schema, input: this.#root })
  }

  #validIf({ targetSchema, root }) {
    if (!isObject(root) && targetSchema.type !== 'object' && targetSchema?.if === undefined) return

    new UseIf({ root, ifRules: targetSchema.if, targetSchema: targetSchema })

    if (!isObject(targetSchema.properties)) return

    for (const key in targetSchema.properties) {
      this.#validIf({ targetSchema: targetSchema.properties[key], input: root })
    }
  }

  #valid({ targetSchema, input, path = [], inEnum = false }) {
    if (isString(targetSchema)) {
      this.#validTypeOf({ value: input, type: targetSchema, path, targetSchema })
      return
    }
    if (this.#validEnum({ type: targetSchema, input, path, inEnum })) return

    this.#validSchemaObject({ targetSchema: targetSchema, input, path, inEnum })
  }

  #validSchemaObject({ targetSchema, input, path, inEnum }) {
    if (!isObject(targetSchema)) return
    if ('properties' in targetSchema && !isObject(targetSchema.properties)) {
      // <schema> El tipo de properties tiene que ser un objeto para la validar ${path}
      throwSchemaError({ type: 'properties', path, targetSchema })
    }
    if (targetSchema.type === undefined) {
      // <schema> Se requiere que type para la validar ${path}
      throwSchemaError({ type: 'requireType', targetSchema, path })
    }

    if (targetSchema.require && input === undefined && targetSchema.default === undefined) {
      // <data> Se require ${key} en ${path}
      throwDataError({ type: 'required', targetSchema, path })
    }

    if (input === undefined) return

    if (this.#validEnum({ type: targetSchema.type, input, path, inEnum })) return
    this.#validTypeOf({
      type: targetSchema.type,
      value: input,
      path,
      nullable: targetSchema?.nullable,
      targetSchema
    })

    this.#validTypeString({ targetSchema, input, path })
    this.#validTypeNumber({ targetSchema, input, path })
    this.#validTypeArray({ targetSchema, input, path })
    this.#validTypeObject({ targetSchema, input, path })
  }

  #validTypeArray({ targetSchema, input, path }) {
    if (targetSchema.type !== 'array') return

    this.#validMaxMin({ targetSchema, input, path, id: 'Items' })

    if (isObject(targetSchema.items)) {
      input.forEach((item, index) => {
        this.#valid({ targetSchema: targetSchema.items, input: item, path: `${path}[${index}]` })
      })
    } else if (isArray(targetSchema.items)) {
      input.forEach((item, index) => {
        this.#valid({
          targetSchema: targetSchema.items[index],
          input: item,
          path: path.concat(index)
        })
      })
    } else if (isString(targetSchema.items)) {
      input.forEach((item, index) => {
        this.#valid({
          targetSchema: targetSchema.items,
          input: item,
          path: path.concat(index)
        })
      })
    }
  }

  #validTypeObject({ targetSchema, input, path }) {
    if (targetSchema.type !== 'object') return

    if (isObject(targetSchema.properties)) {
      for (const key in targetSchema.properties) {
        this.#valid({
          targetSchema: targetSchema.properties[key],
          input: input[key],
          path: path.concat(key)
        })
      }
    }

    this.#validKeys({ targetSchema, input, path })
  }

  #validTypeNumber({ targetSchema, input, path }) {
    if (
      targetSchema.type !== 'number' &&
      targetSchema.type !== 'integer' &&
      targetSchema.type !== 'decimal'
    )
      return

    if ('minimum' in targetSchema && input < targetSchema.minimum) {
      throwDataError({ type: 'minimum', path, targetSchema })
    }
    if ('maximum' in targetSchema && input > targetSchema.maximum) {
      throwDataError({ type: 'maximum', path, targetSchema })
    }
    if ('exclusiveMinimum' in targetSchema && input <= targetSchema.exclusiveMinimum) {
      throwDataError({ type: 'exclusiveMinimum', path, targetSchema })
    }
    if ('exclusiveMaximum' in targetSchema && input >= targetSchema.exclusiveMaximum) {
      throwDataError({ type: 'exclusiveMaximum', path, targetSchema })
    }
  }

  #validTypeString({ targetSchema, input, path }) {
    if (targetSchema.type !== 'string') return

    if (
      targetSchema.pattern &&
      isString(targetSchema.pattern) &&
      !new RegExp(targetSchema.pattern).test(input)
    ) {
      // <data> El string en ${path} no coincide con el pattern
      throwDataError({ type: 'pattern', path, targetSchema })
    }

    this.#validMaxMin({ targetSchema, input, path, id: 'Length' })
  }

  #validEnum({ type, input, path, inEnum }) {
    if (!isArray(type)) return

    if (inEnum || (inEnum && type.length === 0)) {
      throwSchemaError({ type: 'nestedEnum', path })
    }

    if (type.length > 0) {
      let valid = false

      if (new Set(type).has(input)) {
        valid = true
      }

      if (!valid) {
        let index = -1
        for (const _type of type) {
          index++
          if (valid) break
          if (isArray(_type)) {
            throwSchemaError({ type: 'nestedEnum', path })
          }
          if (!isObject(_type)) continue

          try {
            this.#valid({ targetSchema: _type, input, path: path.concat(index), inEnum: true })

            valid = true
          } catch (error) {
            if (error.schemaIssue) {
              throw error
            }
          }
        }
      }

      if (valid) return !0

      // <data> Valor invalido en ${path} solo se permiten: ${type.join(', ')}
      throwDataError({ type: 'enum', path, targetSchema: type })
    }
  }

  #validKeys({ targetSchema, input, path }) {
    if (targetSchema.additionalProperties && !isObject(targetSchema.properties)) return

    const keysSet = new Set(Object.keys(targetSchema.properties))

    for (const key in input) {
      if (!keysSet.has(key)) {
        // La propiedad ${key} es desconocida en ${path}
        throwDataError({ type: 'unexpectedKey', path: path.concat(key), targetSchema })
      }
    }
  }

  #validTypeOf({ value, type, path, nullable, targetSchema }) {
    if (value === undefined) return
    if (nullable && isNull(value)) return
    const typeOf = isTypeof(type, value)
    if (typeOf === undefined) {
      // <schema> El tipo de ${path} no esta permito ${type}
      throwSchemaError({ type: 'typeof', path, targetSchema })
    }
    if (!typeOf) {
      // <data> El tipo de dato en ${path} tiene que ser ${type}
      throwDataError({ type: 'typeof', path, targetSchema })
    }
  }

  #validMaxMin({ targetSchema, input, path, id }) {
    if (targetSchema[`max${id}`] === undefined && targetSchema[`min${id}`] === undefined) return

    const inputLength = input.length,
      maxKey = `max${id}`,
      minKey = `min${id}`,
      max = targetSchema[maxKey],
      min = targetSchema[minKey]

    if (max !== undefined) {
      if (!isNumber(max)) {
        // <schema> El maxLength de ${path} tiene que ser un numero
        throwSchemaError({ type: maxKey, path, targetSchema })
      }
      if (inputLength > max) {
        // <data> La longitud de ${path} es mayor al maximo de ${maxLenght}
        throwDataError({ type: maxKey, path, targetSchema })
      }
    }

    if (min !== undefined) {
      if (!isNumber(min)) {
        // <schema> El minLength de ${path} tiene que ser un numero
        throwSchemaError({ type: minKey, path, targetSchema })
      }
      if (0 >= min) {
        throwSchemaError({ type: `${minKey}Minimum`, path, targetSchema })
      }
      if (inputLength >= min) return
      // <data> La longitud de ${path} es menor al minimo de ${minLenght}

      throwDataError({ type: minKey, path, targetSchema })
    }
  }
}

export { Validator }
export default { Validator }
