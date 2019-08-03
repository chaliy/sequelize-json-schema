// Common types.  These should never be exposed directly but, rather, get cloned
// before being returned.  This avoids cross-contamination if a user modifies
// the their schema.
const ANY = {type: ['object', 'array', 'boolean', 'number', 'string']};
const ARRAY = {type: 'array'};
const BOOLEAN = {type: 'boolean'};
const INTEGER = {type: 'integer'};
const NUMBER = {type: 'number'};
const OBJECT = {type: 'object'};
const STRING = {type: 'string'};

const STRING_LENGTHS = {tiny: 255, medium: 16777215, long: 4294967295};

// Per-type transformation logic
const TRANSFORMS = {
  // ABSTRACT: null,

  ARRAY(att) {
    return {
      ...ARRAY,
      // Sequelize requires att.type to be defined for ARRAYs
      items: attributeSchema({type: att.type.type, allowNull: false})
    };
  },

  BIGINT() {
    return {...INTEGER, format: 'int64'};
  },
  BLOB() {
    return {...STRING, contentEncoding: 'base64'};
  },
  BOOLEAN() {
    return {...BOOLEAN};
  },
  CHAR() {
    return {...STRING};
  },
  CIDR() {
    return {...STRING};
  },
  CITEXT(att) {
    return TRANSFORMS.STRING(att);
  },
  DATE() {
    return {...STRING, format: 'date-time'};
  },
  DATEONLY() {
    return {...STRING, format: 'date'};
  },
  DECIMAL() {
    return {...NUMBER};
  },

  // This is the `key` for DOUBLE datatypes... ¯\_(ツ)_/¯
  'DOUBLE PRECISION'() {
    return {...NUMBER, format: 'double'};
  },

  ENUM(att) {
    return {...STRING, enum: [...att.values]};
  },

  FLOAT() {
    return {...NUMBER, format: 'float'};
  },
  // GEOGRAPHY: null,
  // GEOMETRY: null,
  // HSTORE: null,
  INET() {
    return {type: [{...STRING, format: 'ipv4'}, {...STRING, format: 'ipv6'}]};
  },
  INTEGER() {
    return {...INTEGER, format: 'int32'};
  },
  JSON() {
    return {...ANY, type: [...ANY.type]};
  },
  JSONB() {
    return {...ANY, type: [...ANY.type]};
  },
  MACADDR() {
    return {...STRING};
  },
  MEDIUMINT() {
    return {...INTEGER};
  },
  // NOW: null,
  NUMBER() {
    return {...NUMBER};
  },
  // RANGE: null,
  REAL() {
    return {...NUMBER};
  },
  SMALLINT() {
    return {...INTEGER};
  },

  STRING(att) {
    const schema = {...STRING};
    let length = att.type.options && att.type.options.length;

    // Resolve aliases
    length = STRING_LENGTHS[length] || length;
    if (length) schema.maxLength = length;

    return schema;
  },

  TEXT(att) {
    return TRANSFORMS.STRING(att);
  },

  TIME() {
    return {...STRING, format: 'time'};
  },

  TINYINT() {
    return {...NUMBER};
  },
  UUID() {
    return {...STRING, format: 'uuid'};
  },
  UUIDV1() {
    return {...STRING, format: 'uuid'};
  },
  UUIDV4() {
    return {...STRING, format: 'uuid'};
  },

  VIRTUAL(att) {
    // Use schema for the return type (if defined)
    return attributeSchema({type: att.type && att.type.returnType});
  },
};

/**
 * Add/remove `null` type from an property schema.  This will switch `type`
 * between an array and a single value, depending on the # of types.
 *
 * @param {Object} prop property schema
 * @param {Boolean} allowNull true = add null type, false = remove null type
 */
function allowNullType(prop, allowNull = true) {
  // Sanity check that this is a property schema
  if (!prop.type) throw Error('Attribute `type` not defined');

  const hasNull = Array.isArray(prop.type) ?
    prop.type.includes('null') :
    prop.type == 'null';

  if (hasNull != allowNull) {
    if (allowNull) {
      // Convert to array
      if (!Array.isArray(prop.type)) prop.type = [prop.type];
      prop.type.push('null');
    } else {
      prop.type = prop.type.filter(t => t != 'null');
      if (prop.type.length == 1) prop.type = prop.type[0];
    }
  }

  return prop;
}

/**
 * Generate JSON schema for a Sequelize attribute
 *
 * @param {Attribute} att Sequelize attribute
 * @returns {Object} property schema
 */
function attributeSchema(att) {
  const transform = att && att.type && TRANSFORMS[att.type.key];
  let schema = transform ? transform(att) : transform;

  // Use "any" schema for anything that's not recognized.  'Not entirely sure
  // this is the right thing to do.  File an issue if you think it should behave
  // differently.
  if (!schema) schema = {...ANY, type: [...ANY.type]};

  // Add 'null' type?
  if (att.allowNull !== false) allowNullType(schema, att.allowNull);

  return schema;
}

/**
 * Generate JSON Schema for a Sequelize Model
 *
 * @param {Model} model Sequelize.Model to schema-ify
 * @param {Object} options Optional options
 * @param {Array} options.include Attributes to include in schema
 * @param {Array} options.exclude  Attributes to exclude from schema (overrides
 * `include`)
 */
function getJSONSchema(model, options = {}) {
  const schema = {...OBJECT, properties: {}, required: []};

  const {NODE_ENV} = process.env;

  // Emit warnings about legacy options
  if (options.attributes) {
    throw Error('`attributes` option is deprecated (Use `include` instead)');
  }
  if (options.private) {
    throw Error('`private` option is deprecated (Use `exclude` instead)');
  }
  if (options.alwaysRequired) {
    throw Error('`alwaysRequired` option is no longer supported (Add required properties `schema.required[]` in the returned schema');
  }
  if (options.allowNull) {
    throw Error('`allowNull` option is no longer supported (Use sjs.allowNullType(property[, allowNull]) to add/remove null types in the returned schema)');
  }


  const exclude = options.exclude || [];
  let atts = options.include || Object.keys(model.rawAttributes);
  atts = atts.filter(k => !exclude.includes(k));

  for (const attName of atts) {
    const att = model.rawAttributes[attName];
    if (!att) throw Error(`'${attName}' attribute not found in model`);

    schema.properties[attName] = attributeSchema(att);
    if (att.allowNull === false) schema.required.push(attName);
  }

  return schema;
};

module.exports.getJSONSchema = getJSONSchema;
module.exports.allowNullType = allowNullType;
