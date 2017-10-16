'use strict';

let Sequelize = require('sequelize');

let enumProperty = attribute => {
    return {
      enum: attribute.values
    }
}

let property = (attribute, options) => {
  let type = attribute.type;

  let addNull = attribute.allowNull && options.allowNull

  if (type instanceof Sequelize.ENUM) return enumProperty(attribute);
  if (type instanceof Sequelize.BOOLEAN) return { type: addNull ? ['boolean', 'null'] : 'boolean' };
  if (type instanceof Sequelize.INTEGER) return { type: addNull ? ['integer', 'null'] : 'integer', format: 'int32' };
  if (type instanceof Sequelize.BIGINT) return { type: addNull ? ['integer', 'null'] : 'integer', format: 'int64' };

  if (type instanceof Sequelize.FLOAT
    || type instanceof Sequelize.REAL) {
    return { type: addNull ? ['number', 'null'] : 'number', format: 'float' };
  }

  if (type instanceof Sequelize.DOUBLE) { return { type: addNull ? ['number', 'null'] : 'number', format: 'double' }; }

  if (type instanceof Sequelize.DECIMAL) { return { type: addNull ? ['number', 'null'] : 'number' }; }

  if (type instanceof Sequelize.DATEONLY) { return { type: addNull ? ['string', 'null'] : 'string', format: 'date' }; }
  if (type instanceof Sequelize.DATE) { return { type: addNull ? ['string', 'null'] : 'string', format: 'date-time' }; }
  if (type instanceof Sequelize.TIME) { return { type: addNull ? ['string', 'null'] : 'string'}; }

  if (type instanceof Sequelize.UUID
    || type instanceof Sequelize.UUIDV1
    || type instanceof Sequelize.UUIDV4) {
    return { type: addNull ? ['string', 'null'] : 'string', format: 'uuid' };
  }

  if (type instanceof Sequelize.CHAR
    || type instanceof Sequelize.STRING
    || type instanceof Sequelize.TEXT
    || type instanceof Sequelize.UUID
    || type instanceof Sequelize.DATE
    || type instanceof Sequelize.DATEONLY
    || type instanceof Sequelize.TIME) {

    const schema = {type: addNull ? ['string', 'null'] : 'string'};

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
    return type.returnType ? property({ type: type.returnType, allowNull: type.allowNull }, options) : { type: addNull ? ['string', 'null'] : 'string'};
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
      schema.properties[attributeName] = property(attribute, options);
      if (false === attribute.allowNull || options.allowNull) {
        schema.required.push(attributeName);
      }
    }
  }

  return schema;
};
