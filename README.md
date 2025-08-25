# Parrotita

A quick, lightweight, and simple alternative inspired by Json Schema.

Parrotita is ideal for use in small applications and configurations. At the moment, it does not support references like Json Schema until recursion issues are resolved. It also has a syntax similar to Json Schema, but it is not the same. Review the complete syntax to see if it is suitable for your intended use.

One feature of Parrotita is that it has if conditionals very similar to Vanilla JavaScript, to improve schemas.

Output is not a list of errors, and it is only an error that can be caught with `try catch`.

## Usage

```js
import { Validator } from "parrotita"

const schema = { ... }
const root = {}

new Validator(schema, root)

```

## Salida del Error

```json
{
  "message": "<message>", // Error message
  "schemaIssue": false, // If it is a data error or internal schema error
  "title": null, // <<--
  "description": null, // <<-- Additional information output
  "examples": null, // <<--
  "default": null, // <<--
  "path": "dates[0]", // Path where the error occurs; the value (root) represents the root of the object
  "type": "pattern" // Type of error
}
```

## Sintaxis

### Ejemplo completo

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "name": {
      "require": true,
      "type": "string",
      "minLength": 3,
      "maxLength": 10
    },
    "age": {
      "type": "integer",
      "exclusiveMinimum": 20,
      "exclusiveMaximum": 80
    },
    "mail": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    "phones": {
      "type": "array",
      "minLength": 1,
      "maxLength": 3,
      "items": {
        "type": "object",
        "properties": {
          "type": "string",
          "number": {
            "type": "string",
            "pattern": "^\\(?(\\d{3})\\)?[-]?(\\d{3})[-]?(\\d{4})$"
          }
        }
      }
    },
    "hobbies": {
      "type": "array",
      "nullable": true,
      "items": "string"
    },
    "type": {
      "require": true,
      "type": ["admin", "user"]
    }
  }
}
```

---

### type

Parrotita supports two syntaxes to improve performance and readability when writing types.

**Form object**:
I recommend using it only when you have other options, but if it's just for writing the type, use the string form, but you can use it anyway, it's the same thing.

```json
{
  "propeties": {
    "name": {
      "type": "string" // <<---
    }
  }
}
```

**String form**:
The string form is a reduced form used to improve performance.

```json
{
  "propeties": {
    "name": "string" // <<---
  }
}
```

Accepted types

- `string`
- `number`
- `integer`
- `decimal`
- `boolean`
- `array`
- `object`
- `enums` are a special type that can only be used if the value is an array.

`enums` are a list of values, which can be of any type. You can even use schema syntax as a value, but they cannot contain other `enums` within themselves, as this would not make sense.

---

### requiere

If this is set to ‘true’, the field must be completed with the correct value for the type. The default setting is ‘false’.

```json
{
  "type": "string",
  "require": true
}
```

---

## default

Used to declare a default value for a property. The value that can be set to `default` can be anything.
The default value prevents require from executing an error if the property was not written.

```json
{
  "type": "string",
  "require": true,
  "default": "<some>"
}
```

---

### nullable

If set to ‘true’, the value can also be null. The default value is ‘false’.

```json
{
  "type": "string",
  "nullable": true
}
```

---

### pattern

Can only be used if the type is a `string`, allows regular expressions to validate the string.

```json
{
  "type": "string",
  "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
}
```

---

### minLength, maxLength

They can only be used if the type is a `string`. They allow you to set a minimum and maximum length for the string. Their minimum values are 1; values below this are not allowed.

```json
{
  "type": "string",
  "minLength": 3,
  "maxLength": 10
}
```

---

### minimum, maximum, exclusiveMinimum, exclusiveMaximum

They can only be used if the type is a `number`. They allow you to set a minimum and maximum for the number, and with exclusiveMinimum and exclusiveMaximum, they follow a range of numbers.

```json
{
  "type": "integer",
  "minimum": 18,
  "maximum": 99
}
```

o

```json
{
  "type": "integer",
  "exclusiveMinimum": 20,
  "exclusiveMaximum": 80
}
```

---

### items

It can only be used if the type is `array`, allowing the elements of the array to comply with a type or schema.
`items` is written in the same way as `type`, except that it applies to each element of the array, and if the value of items is an array, each schema in the list will apply to the element with the same index.

```json
{
  "type": "array",
  "items": {
    "type": "string"
  }
}
```

```json
{
  "type": "array",
  "items": "string"
}
```

```json
{
  "type": "array",
  "items": [
    {
      "type": "number",
      "exclusiveMinimum": 10
    },
    "string"
  ]
}
```

---

### minItems, maxItems

They can only be used if the type is an `array`. They allow the array to have a minimum and maximum number of elements. Their minimum values are 1; values below this are not allowed.

```json
{
  "type": "array",
  "minItems": 1,
  "maxItems": 3
}
```

---

### properties

It can only be used if the type is an `object`, allowing you to validate certain properties that the object has.

```json
{
  "type": "object",
  "properties": {
    // <key>: <schema>
  }
}
```

---

### additionalProperties

It can only be used if the type is an `object`. If it is set to ‘true’, only the values in `properties` are allowed, and no additional values are permitted. The default setting is ‘true’.

```json
{
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "name": {
      // <schema>
    }
  }
}
```

You can also make additional properties have their own schema; this schema only applies to properties that do not have one.

```json
{
  "type": "object",
  "additionalProperties": "number" // <schema>,
  "properties": {
    "name": { // << usa su esquema y no el de additionalProperties
      // <schema>
    }
  }
}

```

---

## if

Allows you to create conditions for fields

Examples:

```json
"if": {
"value": "<variable path>",
"conditions": [
  {
    "operator": "!=",
    "value": "<value>",
    "addProperties": {
      // properties...
    }
  },
]
}
```

or

```json
"if": {
"value": "<variable path>",
"conditions": {
    "operator": "!=",
    "value": "<value>",
    "addProperties": {
      // properties...
    }
  }
}
```

The `if.value` must be the path to the property. To access the root property, use a period.

The syntax for paths is:

```js
// syntax
// obj.path
// obj.path.property
// obj.path[property.sub]
// obj.path.[property.sub]
// obj.path[property].sub
// obj.path[property][sub]
```

`if.conditions` contains one or more conditions.
Each condition must have an `operator` in order to start.
Accepted values for the `operator`:

- `=`
- `!=`
- `>`
- `<`
- `>=`
- `<=`
- `typeof`: If it is a specific type, use JavaScript types.

And the `value` can be any value, but it is needed for the condition to start. This value will be compared with the value of `if.value` using the chosen operator.

And if the condition is not met, you can use `else` and `elseIf`. The latter takes priority if both are written. Each `elseIf` is a condition with an operator and value, and each `else` can only use the `addProperties` property for the time being.

```json
{
  "operator": "!=",
  "value": "<value>",
  "addProperties": {
    // properties...
  },
  "else": {
    // addProperties
  },
  "elseIf": {
    // condition
  }
}
```

Only action that can be taken for now, if a condition is met, is to add new properties to the schema where the `if` is written. This can be done with `addProperties`, which is the same as `properties`.

```json
{
  "operator": "!=",
  "value": "<value>",
  "addProperties": {
    // properties...
  }
}
```

---

### title, description, examples

It has no functional use; it only serves to provide more information when the error occurs.

```json
{
  "title": "<title>",
  "description": "<description>",
  "examples": ["<example>"]
}
```
