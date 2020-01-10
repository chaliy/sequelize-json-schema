const Sequelize = require('sequelize');
const assert = require('assert');
const {getSequelizeSchema, getModelSchema, getAttributeSchema} = require('../src');
const Ajv = require('ajv');

const ajv = new Ajv({unknownFormats: ['int32', 'int64', 'float', 'double', 'ipv4', 'ipv6']});
const {DataTypes} = Sequelize;

// Helper to assert that schemas are equal and valid
function schemaEqual(actual, expected) {
  assert.deepEqual(actual, expected);
  assert.doesNotThrow(() => ajv.compile(actual));
}

describe(`getAttributeSchema()`, () => {
  const sequelize = new Sequelize('', '', '', {dialect: 'sqlite'});

  /**
   * Helper for testing DataType schemas.
   *
   * @param {String} name DataType name
   * @param {...args} args to pass to DataType constructor
   * @param {Object} schema Expected schema
   */
  function _testType(name, ...args) {
    const expected = args.pop();

    let atts = DataTypes[name];
    atts = args.length ? atts(...args) : atts;

    const testName = `${name}${args.length ? `(${args.map(String).join()})` : '' } schema`;
    const attName = `${name.toLowerCase()}Attribute`;

    it(testName, () => {
      // Create model
      const model = sequelize.define('_model', {[attName]: {type: atts, allowNull: false}});

      // Assert schema is expected structure
      schemaEqual(getAttributeSchema(model.rawAttributes[attName]), expected);
    });
  }

  _testType('ARRAY', DataTypes.STRING, {type: 'array', items: {type: 'string'}});
  _testType('ARRAY', DataTypes.INTEGER, {type: 'array', items: {type: 'integer', format: 'int32'}});
  _testType('BIGINT', {type: 'integer', format: 'int64'});
  _testType('BLOB', {type: 'string', contentEncoding: 'base64'});
  _testType('BOOLEAN', {type: 'boolean'});
  _testType('CHAR', {type: 'string'});
  _testType('CIDR', {type: 'string'});
  _testType('CITEXT', {type: 'string'});
  _testType('DATE', {type: 'string', format: 'date-time'});
  _testType('DATEONLY', {type: 'string', format: 'date'});
  _testType('DECIMAL', {type: 'number'});
  _testType('DOUBLE', {type: 'number', format: 'double'});
  _testType('ENUM', 'abc', 123, {type: 'string', enum: ['abc', 123]});
  _testType('FLOAT', {type: 'number', format: 'float'});
  _testType('INET', {anyOf: [{type: 'string', format: 'ipv4'}, {type: 'string', format: 'ipv6'}]});
  _testType('INTEGER', {type: 'integer', format: 'int32'});
  _testType('JSON', DataTypes.JSON(DataTypes.ARRAY), {});
  _testType('JSON', {});
  _testType('JSONB', {});
  _testType('MACADDR', {type: 'string'});
  _testType('MEDIUMINT', {type: 'integer'});
  _testType('NUMBER', {type: 'number'});
  _testType('REAL', {type: 'number'});
  _testType('SMALLINT', {type: 'integer'});
  _testType('STRING', {type: 'string'});
  _testType('STRING', 100, {type: 'string', maxLength: 100});
  _testType('STRING', 40, {type: 'string', maxLength: 40});
  _testType('TEXT', 'long', {type: 'string', maxLength: 4294967295});
  _testType('TEXT', 'medium', {type: 'string', maxLength: 16777215});
  _testType('TEXT', 'tiny', {type: 'string', maxLength: 255});
  _testType('VIRTUAL', DataTypes.STRING, {type: 'string'});
  _testType('VIRTUAL', DataTypes.ARRAY(DataTypes.STRING), {type: 'array', items: {type: 'string'}});
});

describe(`getModelSchema()`, () => {
  const OPTIONS = {exclude: ['createdAt', 'updatedAt', 'id']};
  const sequelize = new Sequelize('', '', '', {dialect: 'sqlite'});

  it('empty model', () => {
    const model = sequelize.define('_model', {});

    schemaEqual(
      getModelSchema(model, OPTIONS),
      {type: 'object', properties: {}}
    );
  });

  it('basic model', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
    });

    schemaEqual(
      getModelSchema(model, OPTIONS),
      {
        type: 'object',
        properties:
        {
          s1: {type: ['string', 'null']},
        },
      }
    );
  });

  it('allowNull:true => allows null', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
      s2: {allowNull: true, type: DataTypes.STRING},
    });

    schemaEqual(
      getModelSchema(model, OPTIONS),
      {
        type: 'object',
        properties: {
          s1: {type: ['string', 'null']},
          s2: {type: ['string', 'null']},
        },
      }
    );
  });

  it('allowNull:false => omits null, requires property', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
      s2: {allowNull: false, type: DataTypes.STRING},
      s3: DataTypes.STRING
    });

    schemaEqual(
      getModelSchema(model, OPTIONS),
      {
        type: 'object',
        properties: {
          s1: {type: ['string', 'null']},
          s2: {type: 'string'},
          s3: {type: ['string', 'null']},
        },
        required: ['s2'],
      }
    );
  });

  it('options.attributes', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
      s2: DataTypes.STRING,
      s3: DataTypes.STRING
    });

    schemaEqual(
      getModelSchema(model, {attributes: ['s1', 's2']}),
      {
        type: 'object',
        properties: {
          s1: {type: ['string', 'null']},
          s2: {type: ['string', 'null']},
        }
      }
    );
  });

  it('options.exclude', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
      s2: DataTypes.STRING,
    });

    schemaEqual(
      getModelSchema(model, {exclude: [...OPTIONS.exclude, 's2']}),
      {
        type: 'object',
        properties: {
          s1: {type: ['string', 'null']},
        }
      }
    );
  });

  it('options.attributes <=> options.exclude interaction', () => {
    const model = sequelize.define('_model', {
      s1: DataTypes.STRING,
      s2: DataTypes.STRING,
      s3: DataTypes.STRING
    });

    schemaEqual(
      getModelSchema(model, {
        attributes: ['s1', 's2'],
        exclude: ['s2']
      }),
      {
        type: 'object',
        properties: {
          s1: {type: ['string', 'null']}
        },
      }
    );
  });
});

describe(`getSequelizeSchema`, () => {
  const OPTIONS = {exclude: ['createdAt', 'updatedAt']};
  const sequelize = new Sequelize('', '', '', {dialect: 'sqlite'});

  it('hasOne', () => {
    const Foo = sequelize.define('Foo', {});
    const Bar = sequelize.define('Bar', {});

    Foo.hasOne(Bar);

    schemaEqual(
      getSequelizeSchema(sequelize, OPTIONS),
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        definitions: {
          Foo: {
            type: 'object',
            properties: {
              id: {format: 'int32', type: 'integer'},
              Bar: {$ref: '#/definitions/Bar'}
            },
            required: ['id'],
          },
          Bar: {
            type: 'object',
            properties: {
              id: {format: 'int32', type: 'integer'}
            },
            required: ['id'],
          }
        },
      }
    );
  });

  it('belongsTo', () => {
    const Foo = sequelize.define('Foo', {});
    const Bar = sequelize.define('Bar', {});

    Foo.belongsTo(Bar);

    schemaEqual(
      getSequelizeSchema(sequelize, OPTIONS), {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      definitions: {
        Foo: {
          type: 'object',
          properties: {
            id: {format: 'int32', type: 'integer'},
            Bar: {$ref: '#/definitions/Bar'}
          },
          required: ['id'],
        },
        Bar: {
          type: 'object',
          properties: {
            id: {format: 'int32', type: 'integer'}
          },
          required: ['id'],
        }
      },
    });
  });

  it('hasMany', () => {
    const Foo = sequelize.define('Foo', {});
    const Bar = sequelize.define('Bar', {});

    Foo.hasMany(Bar);

    schemaEqual(
      getSequelizeSchema(sequelize, OPTIONS), {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      definitions: {
        Foo: {
          type: 'object',
          properties: {
            id: {format: 'int32', type: 'integer'},
            Bars: {type: 'array', items: {$ref: '#/definitions/Bar'}}
          },
          required: ['id'],
        },
        Bar: {
          type: 'object',
          properties: {
            id: {format: 'int32', type: 'integer'}
          },
          required: ['id'],
        }
      },
    });
  });

  it('belongsToMany', () => {
    const Foo = sequelize.define('Foo', {});
    const Bar = sequelize.define('Bar', {});

    Foo.belongsToMany(Bar, {through: 'join_table'});

    schemaEqual(
      getSequelizeSchema(sequelize, OPTIONS),
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        definitions: {
          Foo: {
            type: 'object',
            properties: {
              id: {format: 'int32', type: 'integer'},
              Bars: {type: 'array', items: {$ref: '#/definitions/Bar'}}
            },
            required: ['id'],
          },
          Bar: {
            type: 'object',
            properties: {
              id: {format: 'int32', type: 'integer'}
            },
            required: ['id'],
          },

          // This is an artifact of having to declare a `through` table, above,
          // for the belongsToMany association
          join_table: {type: 'object', properties: {}}, // eslint-disable-line camelcase
        },
      });
  });
});
