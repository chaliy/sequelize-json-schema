// Common types.  These should never be exposed directly but, instead, be cloned
// before being returned.  This avoids cross-contamination if a user modifies
// the their schema.
const ARRAY = {type: 'array'};
const BOOLEAN = {type: 'boolean'};
const INTEGER = {type: 'integer'};
const NUMBER = {type: 'number'};
const OBJECT = {type: 'object'};
const STRING = {type: 'string'};

// Note: per sec. 4.3.2 of spec, the "any" type can be `true` rather than an empty
// object.  While it makes the intent more explicit, having schemas always be
// Objects makes life easier for users of this module if/when they want to
// inspect or transform the generated schemas
const ANY = {};

const STRING_LENGTHS = {tiny: 255, medium: 16777215, long: 4294967295};

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
    prop.type === 'null';

  if (hasNull !== allowNull) {
    if (allowNull) {
      // Convert to array
      if (!Array.isArray(prop.type)) prop.type = [prop.type];
      prop.type.push('null');
    } else {
      prop.type = prop.type.filter(t => t !== 'null');
      if (prop.type.length === 1) prop.type = prop.type[0];
    }
  }

  return prop;
}

function _includeAttribute(opts, name) {
  const include = (!opts.exclude || !opts.exclude.includes(name)) &&
    (!opts.attributes || opts.attributes.length <= 0 || opts.attributes.includes(name));
  return include;
}

/**
 * Generate JSON schema for a Sequelize attribute
 *
 * @param {Attribute} att Sequelize attribute
 * @returns {Object} property schema
 */
function getAttributeSchema(att) {
  let schema;

  let attType = att && att.type && att.type.key;

  // NOTE: All known sequelize types should be mentioend in the switch blocks
  // below, either under aliases or transforms (but may be commented out if not
  // supported yet)

  // Aliases
  switch (attType) {
    case 'TEXT':
    case 'CITEXT':
      attType = 'STRING';
      break;

    case 'VIRTUAL': {
      return getAttributeSchema({...att, type: att.type.returnType});
    }
  }

  // Transforms (to schema property)
  switch (attType) {
    // ABSTRACT - not supported

    case 'ARRAY': {
      schema = {
        ...ARRAY,
        // Sequelize requires att.type to be defined for ARRAYs
        items: getAttributeSchema({type: att.type.type, allowNull: false})
      };
      break;
    }

    case 'BIGINT': { schema = {...INTEGER, format: 'int64'}; break; }
    case 'BLOB': { schema = {...STRING, contentEncoding: 'base64'}; break; }
    case 'BOOLEAN': { schema = {...BOOLEAN}; break; }
    case 'CHAR': { schema = {...STRING}; break; }
    case 'CIDR': { schema = {...STRING}; break; }

    case 'DATE': { schema = {...STRING, format: 'date-time'}; break; }
    case 'DATEONLY': { schema = {...STRING, format: 'date'}; break; }
    case 'DECIMAL': { schema = {...NUMBER}; break; }

    // This is the `key` for DOUBLE datatypes... ¯\_(ツ)_/¯
    case 'DOUBLE PRECISION': { schema = {...NUMBER, format: 'double'}; break; }
    case 'ENUM': { schema = {...STRING, enum: [...att.values]}; break; }
    case 'FLOAT': { schema = {...NUMBER, format: 'float'}; break; }
    // GEOGRAPHY - needs definition
    // GEOMETRY - needs definition
    // HSTORE - needs definition
    case 'INET': {schema = {anyOf: [{...STRING, format: 'ipv4'}, {...STRING, format: 'ipv6'}]}; break; }

    case 'INTEGER': { schema = {...INTEGER, format: 'int32'}; break; }
    case 'JSON': { schema = {...ANY}; break; }
    case 'JSONB': { schema = {...ANY}; break; }
    case 'MACADDR': { schema = {...STRING}; break; }
    case 'MEDIUMINT': { schema = {...INTEGER}; break; }
    // NOW: null,
    case 'NUMBER': { schema = {...NUMBER}; break; }
    // RANGE: null,
    case 'REAL': { schema = {...NUMBER}; break; }
    case 'SMALLINT': { schema = {...INTEGER}; break; }

    case 'STRING': {
      schema = {...STRING};
      let length = att.type.options && att.type.options.length;

      // Resolve aliases
      length = STRING_LENGTHS[length] || length;
      if (length) schema.maxLength = length;
      break;
    }

    case 'TIME': { schema = {...STRING, format: 'time'}; break; }
    case 'TINYINT': { schema = {...NUMBER}; break; }
    case 'UUID': { schema = {...STRING, format: 'uuid'}; break; }
    case 'UUIDV1': { schema = {...STRING, format: 'uuid'}; break; }
    case 'UUIDV4': { schema = {...STRING, format: 'uuid'}; break; }
  }

  // Use ANY for anything that's not recognized.  'Not entirely sure
  // this is the right thing to do.  File an issue if you think it should behave
  // differently.
  if (!schema) schema = {...ANY};

  // Add 'null' type?
  if (att.allowNull !== false) allowNullType(schema, att.allowNull);

  return schema;
}

/**
 * Generate JSON Schema for a Sequelize Model
 *
 * @param {Model} model Sequelize.Model to schema-ify
 * @param {Object} options Optional options
 * @param {Array} options.attributes Attributes to include in schema
 * @param {Array} options.exclude  Attributes to exclude from schema (overrides
 * `attributes`)
 */
function getModelSchema(model, options = {}) {
  const schema = {...OBJECT, properties: {}, required: []};
  const {useRefs = true} = options;

  // Emit warnings about legacy options
  if (options.private) {
    throw Error('`private` option is deprecated (Use `exclude` instead)');
  }
  if (options.alwaysRequired) {
    throw Error('`alwaysRequired` option is no longer supported (Add required properties `schema.required[]` in the returned schema');
  }
  if (options.allowNull) {
    throw Error('`allowNull` option is no longer supported (Use sjs.allowNullType(property[, allowNull]) to add/remove null types in the returned schema)');
  }

  // Define propertiesk
  for (const attName of Object.keys(model.rawAttributes)) {
    if (!_includeAttribute(options, attName)) continue;

    const att = model.rawAttributes[attName];
    if (att.references && useRefs !== false) {
      // Association references will get picked up in the next step, so don't
      // treat them as properties here
      continue;
    }
    if (!att) throw Error(`'${attName}' attribute not found in model`);

    schema.properties[attName] = getAttributeSchema(att);
    if (att.allowNull === false) schema.required.push(attName);
  }

  // Define associations(?)
  if (useRefs !== false) {
    for (const [, assoc] of Object.entries(model.associations)) {
      const {associationType, target, associationAccessor} = assoc;

      if (!_includeAttribute(options, associationAccessor)) continue;

      let assSchema;
      switch (associationType) {
        case 'HasOne':
        case 'BelongsTo':
          assSchema = {$ref: `#/definitions/${target.name}`};
          break;
        case 'HasMany':
        case 'BelongsToMany':
          assSchema = {
            type: 'array',
            items: {$ref: `#/definitions/${target.name}`}
          };
          break;
        default:
          throw Error(`Unrecognized association type: "${associationType}"`);
      }

      schema.properties[associationAccessor] = assSchema;
    }
  }

  if (!schema.required.length) delete schema.required;

  return schema;
}

function getSequelizeSchema(seq, options = {}) {
  const {modelOptions = {}} = options;
  // Per https://json-schema.org/understanding-json-schema/structuring.htmlk
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...OBJECT,
    definitions: {},
  };

  // Definitions
  for (const [name, model] of Object.entries(seq.models)) {
    const mopts = {exclude: [], attributes: [], ...modelOptions[name]};
    if (options.attributes) mopts.attributes.push(...options.attributes);
    if (options.exclude) mopts.exclude.push(...options.exclude);
    const modelSchema = getModelSchema(model, mopts);
    schema.definitions[model.name] = modelSchema;
  }

  return schema;
}

module.exports = {
  getAttributeSchema,
  getModelSchema,
  getSequelizeSchema,
};
