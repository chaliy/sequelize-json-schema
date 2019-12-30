```javascript --hide --run
runmd.onRequire = path => path == 'sequelize-json-schema' ? '.' : path;
```

# sequelize-json-schema

[![NPM Version](https://img.shields.io/npm/v/sequelize-json-schema.svg)](https://npmjs.org/package/sequelize-json-schema)
[![CircleCI](https://circleci.com/gh/chaliy/sequelize-json-schema.svg?style=svg)](https://circleci.com/gh/chaliy/sequelize-json-schema)

Generate [JSON Schema](https://json-schema.org/) structures from Sequelize
instances, models, and model attributes.

Schemas may be generated at three levels of granularity:

|   |   |
|---|---|
| `getSequelizeSchema()` | Generate a full description of your database (all models, attributes, and associations) |
| `getModelSchema()` | Generate the schema `definitions` entry for a specific model (all attributes) |
| `getAttributeSchema()` | Generate the `properties` entry for a specific attribute |

See API documentation below for details and examples.

## Installation

```bash
npm install sequelize-json-schema
```

## Migrating v1 &rarr; v2

The version 1 API of this module is available as `getModelSchema()`, with the following changes:
- `private` option has been removed.  Use `exclude` instead.
- `alwaysRequired` option has been removed.  Schemas should be manually amended
if needed using `schema.required.push(...Object.keys(schema.properties))`.
- `allowNull` option has been removed.  (Schema reflects the `allowNull`
    property of individual attributes).

## API

Note: API examples below assume the following setup code:
```javascript --run main
// Import this module
const sjs = require('sequelize-json-schema');

// Import Sequelize thingz
const Sequelize = require('Sequelize');
const {DataTypes} = Sequelize;

// Create a sequelize instance
const sequelize = new Sequelize('database', 'username', 'password', {dialect: 'sqlite'});
```

### getSequelizeSchema(sequelize[, options])

|   |   |
|---|---|
| `sequelize` | `Sequelize` A Sequelize instance |
| `options.useRefs` | Default for `useRefs` model option |
| `options.attributes` | Default for `attributes` model option |
| `options.exclude` | Default for `exclude` model option |
| `options.modelOptions` | Model-specific options |
|  *(returns)* | `Object` JSON Schema object |

#### Example
Schema for simple one-model schema:
```javascript --run main
const Person = sequelize.define('Person', {name: DataTypes.STRING});

console.log(sjs.getSequelizeSchema(sequelize));
```

... continuing on, use `options` to exclude a few properties:
```javascript --run main
const options = {exclude: ['id', 'createdAt', 'updatedAt']};

console.log(sjs.getSequelizeSchema(sequelize, options));
```

... continuing on, add another model and some associations:

```javascript --run main
const Address = sequelize.define('Address', {
  street: DataTypes.STRING('tiny'),
  city: DataTypes.STRING,
  state: {type: DataTypes.STRING(2)},
  zipcode: DataTypes.NUMBER,
});

Person.hasOne(Address);
Address.hasMany(Person);

console.log(sjs.getSequelizeSchema(sequelize, options));
```

... continuing (customizing with `options` and `modelOptions`):

```javascript --run main
console.log(sjs.getSequelizeSchema(sequelize, {
  exclude: ['createdAt', 'updatedAt'],
  modelOptions: {
    Person: {exclude: ['id']},
    Address: {attributes: ['id']},
  }
}));
```

### getModelSchema(model[, options])

|   |   |
|---|---|
| `model` | `Sequelize.Model` | Sequelize model instance |
| `options` | `Object` |
| `options.useRefs` | `Boolean = true` Determines how associations are described in the schema.  If true, `model.associations` are described as `$ref`s to the appropriate entry in the schema `definitions`.  If false, assiciations are described as plain attributes |
| `options.attributes` | `Array` Attributes to include in the schema |
| `options.exclude` | `Array` Attributes to exclude from the schema |
|  *(return)* | `Object` JSON Schema definition for the model|

#### Example

... continuing `getSequelizeSchema()` example, above:

```javascript --run main
console.log(sjs.getModelSchema(Person));
```

... continuing (useRefs = false to treat associations as plain attributes):

```javascript --run main
console.log(sjs.getModelSchema(Person, {useRefs: false}));
```

### getAttributeSchema(attribute)

|   |   |
|---|---|
| `attribute` | `Sequelize.Model attribute` |  |
|  *(returns)* | `Object` JSON Schema property for the attribute|

#### Example

... continuing `getModelSchema()` example, above:

```javascript --run main
console.log(sjs.getAttributeSchema(Person.rawAttributes.name));
```

