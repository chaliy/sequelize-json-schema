# sequelize-json-schema

[![NPM Version](https://img.shields.io/npm/v/sequelize-json-schema.svg)](https://npmjs.org/package/sequelize-json-schema)
[![CircleCI](https://circleci.com/gh/chaliy/sequelize-json-schema.svg?style=svg)](https://circleci.com/gh/chaliy/sequelize-json-schema)

Generate [JSON Schema](https://json-schema.org/) definitions from Sequelize models

## Installation

```bash
npm install sequelize-json-schema
```

## Example

```
const {getJSONSchema} = require('sequelize-json-schema');

const MyModel = sequelize.define('simple', {
  title: Sequelize.STRING,
  description: {type: Sequelize.TEXT, allowNull: false}
});

const schema = getJSONSchema(MyModel);

console.log(def);
```

Outputs:

```
{
  type: 'object',
  properties: {
    id: {type: 'integer', format: 'int32'},
    title: {type: ['string', 'null]},
    description: {type: 'string'},
    createdAt: {type: 'string', format: 'date-time'},
    updatedAt: {type: 'string', format: 'date-time'}
  }
}
```

## API

### getJSONSchema(model[, options])

Generate a JSON Schema from a Sequelize model

* `{Sequelize.Model} model` - Model to generate JSON schema from
* `{Array} [options.include]` - Attributes to include in the schema
* `{Array} [options.exclude]` - Attributes to exclude from the schema.  This
takes precedence over the `include` option. I.e. if an attribute is both
`include`ed and `exclude`ed, it will be excluded from the schema.

**Returns** {Object} - JSON Schema for the model

Example incantations:
```
getJSONSchema(MyModel, {include: ['title', 'description']});
getJSONSchema(MyModel, {exclude: ['id', 'createdAt', 'updatedAt']});
```


### allowNullType(property_schema[, allowNull])

Modify a JSON Schema property to add / remove the 'null' type.  This is used
internally, but also provided as a convenience for callers wishing to transform
schemas after-the-fact (a not-uncommon case).

* `{Object} property` - JSON schema `property` to modify
* `{Array} [options.include]` - Attributes to include in the schema
* `{Array} [options.exclude]` - Attributes to exclude from the schema.  This
takes precedence over the `include` option. I.e. if an attribute is both
`include`ed and `exclude`ed, it will be excluded from the schema.

**Returns** undefined

Example incantations:
```
allowNullType(schema.properties.description);   // Adds 'null' to `types` field
allowNullType(schema.properties.title, false);  // Remove's null from types
```
