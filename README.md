<!--
  -- This file is auto-generated from README_js.md. Changes should be made there.
  -->

# sequelize-json-schema

[![NPM Version](https://img.shields.io/npm/v/sequelize-json-schema.svg)](https://npmjs.org/package/sequelize-json-schema)
[![CircleCI](https://circleci.com/gh/chaliy/sequelize-json-schema.svg?style=svg)](https://circleci.com/gh/chaliy/sequelize-json-schema)

Generate [JSON Schema](https://json-schema.org/) definitions from Sequelize models

## Installation

```bash
npm install sequelize-json-schema
```

Then in JS:
```javascript
const {getJSONSchema} = require('sequelize-json-schema');

```

## Example

Generate a schema from a model:

```javascript
const {DataTypes} = Sequelize;

const MyModel = sequelize.define('simple', {
  title: {type: DataTypes.STRING, allowNull: false},
  description: DataTypes.TEXT
});

const schema = getJSONSchema(MyModel); // ⇨ 
  // { type: 'object',
  //   properties: 
  //    { id: { type: 'integer', format: 'int32' },
  //      title: { type: 'string' },
  //      description: { type: [ 'string', 'null' ] },
  //      createdAt: { type: 'string', format: 'date-time' },
  //      updatedAt: { type: 'string', format: 'date-time' } },
  //   required: [ 'id', 'title', 'createdAt', 'updatedAt' ] }

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

### allowNullType(property_schema[, allowNull])

Helper method for adding or removing the 'null' type from a property, which some
callers may find useful.

* `{Object} property` - JSON schema `property` to modify
* `{Array} [options.include]` - Attributes to include in the schema
* `{Array} [options.exclude]` - Attributes to exclude from the schema.  This
takes precedence over the `include` option. I.e. if an attribute is both
`include`ed and `exclude`ed, it will be excluded from the schema.

**Returns** `property` argument.

Example:

```javascript
const {allowNullType} = require('sequelize-json-schema');

allowNullType(schema.properties.title);   // ⇨ { type: [ 'string', 'null' ] }
allowNullType(schema.properties.description, false);  // ⇨ { type: 'string' }

```


----
Markdown generated from [README_js.md](README_js.md) by [![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)