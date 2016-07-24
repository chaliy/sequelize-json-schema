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
    return { type: 'string' };
  }

  if (type instanceof Sequelize.JSON
    || type instanceof Sequelize.JSONB) {
    return { type: 'any' };
  }

  if (type instanceof Sequelize.VIRTUAL) {
    return type.returnType ? property({ type: type.returnType }) : { type: 'string' };
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
}

let modelProperties = (model, options) => {

  options = options || {};
  let privateProperties = options.private || [];


  let properties = {};
  for(let attributeName in model.rawAttributes){
    
    if (privateProperties.indexOf(attributeName) >= 0){
      continue;
    }

    let attribute = model.rawAttributes[attributeName];

    properties[attributeName] = property(attribute);
  }
  return properties;
}

/**
 * Generates JSON Schema by specified Sequelize Model
 * @constructor
 * @param {object} model - The Sequelize Model
 * @param {objecct} options - Optional optsions
 */
module.exports = (model, options) => {
  return {
    type: 'object',
    properties: modelProperties(model, options)
  };

};
