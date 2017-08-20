'use strict';

let Sequelize = require('sequelize');

let enumProperty = attribute => {
    return {
      enum: attribute.values
    }
}

let property = attribute => {
  let type = attribute.type;

  if (type instanceof Sequelize.ENUM) return enumProperty(attribute);
  if (type instanceof Sequelize.BOOLEAN) return { type: 'boolean' };
  if (type instanceof Sequelize.INTEGER) return { type: 'integer', format: 'int32' };
  if (type instanceof Sequelize.BIGINT) return { type: 'integer', format: 'int64' };

  if (type instanceof Sequelize.FLOAT
    || type instanceof Sequelize.REAL) {
    return { type: 'number', format: 'float' };
  }

  if (type instanceof Sequelize.DOUBLE) { return { type: 'number', format: 'double' }; }

  if (type instanceof Sequelize.DECIMAL) { return { type: 'number' }; }

  if (type instanceof Sequelize.DATEONLY) { return { type: 'string', format: 'date' }; }
  if (type instanceof Sequelize.DATE) { return { type: 'string', format: 'date-time' }; }
  if (type instanceof Sequelize.TIME) { return { type: 'string' }; }

  if (type instanceof Sequelize.UUID
    || type instanceof Sequelize.UUIDV1
    || type instanceof Sequelize.UUIDV4) {
    return { type: 'string', format: 'uuid' };
  }

  if (type instanceof Sequelize.CHAR
    || type instanceof Sequelize.STRING
    || type instanceof Sequelize.TEXT
    || type instanceof Sequelize.UUID
    || type instanceof Sequelize.DATE
    || type instanceof Sequelize.DATEONLY
    || type instanceof Sequelize.TIME) {

    const schema = {type: 'string'};

    var maxLength = (type.options && type.options.length) || type._length;

    if (type instanceof Sequelize.TEXT) {
      // Handle 'tiny', 'medium', and 'long' allowed for MySQL
      switch (maxLength) {
        case 'tiny': maxLength = 255; break;
        case 'medium': maxLength = 16777215; break;
        case 'long': maxLength = 4294967295; break;
      }

    }

    if (maxLength) schema.maxLength = maxLength;

    return schema;
  }

  if (type instanceof Sequelize.JSON
    || type instanceof Sequelize.JSONB) {
    return { type: 'any' };
  }

  if (type instanceof Sequelize.VIRTUAL) {
    return type.returnType ? property({ type: type.returnType }) : { type: 'string' };
  }


  //Array type doesn't work so well yes, it comes back as string rather than object
  // and has no indeication of internal type, so we will just assume string
  if (type === 'ARRAY') {
    return { type: 'array', items: { type: 'string' } };
  }
  // Need suport for the following
  // HSTORE
  // NOW
  // BLOB
  // RANGE
  // ARRAY
  // GEOMETRY
  // GEOGRAPHY

  console.log(`Unable to convert ${type.key || type.toSql()} to a schema property`);

  return { type: 'any' };
};

/**
 * Generates JSON Schema by specified Sequelize Model
 * @constructor
 * @param {object} model - The Sequelize Model
 * @param {objecct} options - Optional options
 */
module.exports = (model, options) => {

  options = options || {};

  const schema = {
    type: 'object',
    properties: {},
    required: []
  };

  let exclude = options.exclude || options.private || [];
  let attributes = options.attributes || Object.keys(model.rawAttributes);

  for(let attributeName of attributes) {

    if (exclude.indexOf(attributeName) >= 0) {
      continue;
    }

    let attribute = model.rawAttributes[attributeName];

    if (attribute) {
      schema.properties[attributeName] = property(attribute);
      if (false === attribute.allowNull) {
        schema.required.push(attributeName);
      }
    }
  }

  return schema;
};
