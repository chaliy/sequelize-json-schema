<!--
  -- This file is auto-generated from README_js.md. Changes should be made there.
  -->

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

Note: Examples below assume the following [fairly standard] setup code for
Sequelize:
```javascript
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
```javascript
const Person = sequelize.define('Person', {name: DataTypes.STRING});

console.log(sjs.getSequelizeSchema(sequelize));

⇒ {
⇒   '$schema': 'http://json-schema.org/draft-07/schema#',
⇒   type: 'object',
⇒   definitions: {
⇒     Person: {
⇒       type: 'object',
⇒       properties: {
⇒         id: { type: 'integer', format: 'int32' },
⇒         name: { type: [ 'string', 'null' ], maxLength: 255 },
⇒         createdAt: { type: 'string', format: 'date-time' },
⇒         updatedAt: { type: 'string', format: 'date-time' }
⇒       },
⇒       required: [ 'id', 'createdAt', 'updatedAt' ]
⇒     }
⇒   }
⇒ }
```

... continuing on, use `options` to exclude a few properties:
```javascript
const options = {exclude: ['id', 'createdAt', 'updatedAt']};

console.log(sjs.getSequelizeSchema(sequelize, options));

⇒ {
⇒   '$schema': 'http://json-schema.org/draft-07/schema#',
⇒   type: 'object',
⇒   definitions: {
⇒     Person: {
⇒       type: 'object',
⇒       properties: { name: { type: [ 'string', 'null' ], maxLength: 255 } }
⇒     }
⇒   }
⇒ }
```

... continuing on, add another model and some associations:

```javascript
const Address = sequelize.define('Address', {
  street: DataTypes.STRING('tiny'),
  city: DataTypes.STRING,
  state: {type: DataTypes.STRING(2)},
  zipcode: DataTypes.NUMBER,
});

Person.hasOne(Address);
Address.hasMany(Person);

console.log(sjs.getSequelizeSchema(sequelize, options));

⇒ {
⇒   '$schema': 'http://json-schema.org/draft-07/schema#',
⇒   type: 'object',
⇒   definitions: {
⇒     Person: {
⇒       type: 'object',
⇒       properties: {
⇒         name: { type: [ 'string', 'null' ], maxLength: 255 },
⇒         Address: { '$ref': '#/definitions/Address' }
⇒       }
⇒     },
⇒     Address: {
⇒       type: 'object',
⇒       properties: {
⇒         street: { type: [ 'string', 'null' ], maxLength: 255 },
⇒         city: { type: [ 'string', 'null' ], maxLength: 255 },
⇒         state: { type: [ 'string', 'null' ], maxLength: 2 },
⇒         zipcode: { type: [ 'number', 'null' ] },
⇒         People: { type: 'array', items: { '$ref': '#/definitions/Person' } }
⇒       }
⇒     }
⇒   }
⇒ }
```

... continuing (customizing with `options` and `modelOptions`):

```javascript
console.log(sjs.getSequelizeSchema(sequelize, {
  exclude: ['createdAt', 'updatedAt'],
  modelOptions: {
    Person: {exclude: ['id']},
    Address: {attributes: ['id']},
  }
}));

⇒ {
⇒   '$schema': 'http://json-schema.org/draft-07/schema#',
⇒   type: 'object',
⇒   definitions: {
⇒     Person: {
⇒       type: 'object',
⇒       properties: {
⇒         name: { type: [ 'string', 'null' ], maxLength: 255 },
⇒         Address: { '$ref': '#/definitions/Address' }
⇒       }
⇒     },
⇒     Address: {
⇒       type: 'object',
⇒       properties: { id: { type: 'integer', format: 'int32' } },
⇒       required: [ 'id' ]
⇒     }
⇒   }
⇒ }
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

```javascript
console.log(sjs.getModelSchema(Person));

⇒ {
⇒   type: 'object',
⇒   properties: {
⇒     id: { type: 'integer', format: 'int32' },
⇒     name: { type: [ 'string', 'null' ], maxLength: 255 },
⇒     createdAt: { type: 'string', format: 'date-time' },
⇒     updatedAt: { type: 'string', format: 'date-time' },
⇒     Address: { '$ref': '#/definitions/Address' }
⇒   },
⇒   required: [ 'id', 'createdAt', 'updatedAt' ]
⇒ }
```

... continuing (useRefs = false to treat associations as plain attributes):

```javascript
console.log(sjs.getModelSchema(Person, {useRefs: false}));

⇒ {
⇒   type: 'object',
⇒   properties: {
⇒     id: { type: 'integer', format: 'int32' },
⇒     name: { type: [ 'string', 'null' ], maxLength: 255 },
⇒     createdAt: { type: 'string', format: 'date-time' },
⇒     updatedAt: { type: 'string', format: 'date-time' },
⇒     AddressId: { type: [ 'integer', 'null' ], format: 'int32' }
⇒   },
⇒   required: [ 'id', 'createdAt', 'updatedAt' ]
⇒ }
```

### getAttributeSchema(attribute)

|   |   |
|---|---|
| `attribute` | `Sequelize.Model attribute` |  |
|  *(returns)* | `Object` JSON Schema property for the attribute|

#### Example

... continuing `getModelSchema()` example, above:

```javascript
console.log(sjs.getAttributeSchema(Person.rawAttributes.name));

⇒ { type: [ 'string', 'null' ], maxLength: 255 }
```


----
Markdown generated from [README_js.md](README_js.md) by [![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)