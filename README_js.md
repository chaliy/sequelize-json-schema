```javascript --run main --hide
// `require('sequelize-json-schema')` --> `require('.')`
runmd.onRequire = function(path) {
  return path == 'sequelize-json-schema' ? '.' : path;
}

// Setup for the examples
const Sequelize = require('Sequelize');
const sequelize = new Sequelize('', '', '', {dialect: 'sqlite'});
```

# sequelize-json-schema

[![NPM Version](https://img.shields.io/npm/v/sequelize-json-schema.svg)](https://npmjs.org/package/sequelize-json-schema)
[![CircleCI](https://circleci.com/gh/chaliy/sequelize-json-schema.svg?style=svg)](https://circleci.com/gh/chaliy/sequelize-json-schema)

Generate [JSON Schema](https://json-schema.org/) definitions from Sequelize models

## Installation

```bash
npm install sequelize-json-schema
```

Then in JS:
```javascript --run main
const {getJSONSchema} = require('sequelize-json-schema');
```

## Example

Generate a schema from a model:

```javascript --run main
const {DataTypes} = Sequelize;

const MyModel = sequelize.define('simple', {
  title: {type: DataTypes.STRING, allowNull: false},
  description: DataTypes.TEXT
});

const schema = getJSONSchema(MyModel); // RESULT
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

```javascript --run main
const {allowNullType} = require('sequelize-json-schema');

allowNullType(schema.properties.title);   // RESULT
allowNullType(schema.properties.description, false);  // RESULT
```

