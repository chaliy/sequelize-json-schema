const sjs = require('../src');
const Sequelize = require('sequelize');
const {ok, equal, notEqual, deepEqual} = require('assert');
const sequelize = new Sequelize('database', 'username', 'password', {dialect: 'sqlite'});

// Hack define() to remove extraneous fields while testing (id, timestamps)
sequelize._define = sequelize.define;
sequelize.define = function(name, columns, options = {}) {
  options.timestamps = false;
  const model = this._define(name, columns, options);
  model.removeAttribute('id');
  return model;
}

describe('sequelize-json-schema', () => {
  it('empty model', () => {
    const model = sequelize.define('_model', {});

    deepEqual(sjs(model), { type: 'object', properties: {}, required: [] });
  });

  it('basic model', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      description: Sequelize.TEXT
    });

    deepEqual(
      sjs(model),
      {
        type: 'object',
        properties:
        {
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: []
      }
    );
  });

  it('excluding columns', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      password: {type: Sequelize.STRING},
    });

    deepEqual(
      sjs(model, {exclude: ['password']}),
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
        required: []
      }
    );
  });

  it('explicit attributes and excluding columns', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      password: {type: Sequelize.STRING},
      secret: Sequelize.INTEGER
    });

    deepEqual(
      sjs(model, {
        attributes: ['title', 'password'],
        exclude: ['password']
      }),
      {
        type: 'object',
        properties: {
          title: {type: 'string'}
        },
        required: [],
      }
    )
  });

  it('allowNull: false should disallow null values', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      password: {allowNull: false, type: Sequelize.STRING},
      secret: Sequelize.INTEGER
    });

    deepEqual(sjs(model), {
      type: 'object',
      properties: {
        password: {type: 'string'},
        secret: {format: 'int32', type: 'integer'},
        title: {type: 'string'},
      },
      required: ['password'],
    });
  });

  it('allowNull: true should allow null values', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      password: {
        allowNull: true,
        type: Sequelize.STRING
      }
    });

    deepEqual(
      sjs(model, {allowNull: true}),
      {
        type: 'object',
        properties:
        {
          title: { type: 'string' },
          password: { type: ['string', 'null'] }
        },
        required: []
      }
    );
  })

  it('alwaysRequired prevents null values everywher', () => {
    const model = sequelize.define('_model', {
      title: Sequelize.STRING,
      password: {
        allowNull: true,
        type: Sequelize.STRING
      }
    });

    deepEqual(
      sjs(model, {allowNull: true, alwaysRequired: true}),
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          password: { type: ['string', 'null'] }
        },
        required: ['title', 'password' ]
      }
    );
  })

  //
  // Test various types
  //

  /**
   * Utility for testing the schema generated for a given Sequelize type.
   *
   * Takes the name of DataType, optional arguments to pass to that type, and
   * the expected schema and performs the test.  E.g.
   * ```
   * _testType('ENUM', 'a', 'b', {type: 'string', values: ['a', 'b']});
   * ```
   * ...
   * will test the schema created for a `DataTypes.ENUM('a', 'b')` Sequelize
   * attribute
   *
   * @param {String} name DataType name
   * @param {...args} args to pass to DataType constructor
   * @param {Object} schema Expected schema
   */
  function _testType(name, ...args) {
    const schema = args.pop();

    let atts = Sequelize[name];
    atts = args.length ? atts(...args) : atts;
    it(`${name}${args.length ? `(${args.map(String).join()})` : '' } schema`, () => {
      const model = sequelize.define('_model', {[`type_${name}`]: atts});
      deepEqual(sjs(model).properties, {[`type_${name}`]: schema});
    });
  }

  _testType('ARRAY', Sequelize.STRING, {type: 'array', items: {type: 'string'}});
  _testType('ARRAY', Sequelize.INTEGER, {type: 'array', items: {type: 'integer', format: 'int32'}});
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
  _testType('INET', {type: [{type: 'string', format: 'ipv4'}, {type: 'string', format: 'ipv6'}]});
  _testType('INTEGER', {type: 'integer', format: 'int32'});
  _testType('JSON', Sequelize.JSON(Sequelize.ARRAY), {type: ['object', 'array', 'boolean', 'number', 'string']});
  _testType('JSON', {type: ['object', 'array', 'boolean', 'number', 'string']});
  _testType('JSONB', {type: ['object', 'array', 'boolean', 'number', 'string']});
  _testType('MACADDR', {type: 'string'});
  _testType('MEDIUMINT', {type: 'integer'});
  _testType('NUMBER', {type: 'number'});
  _testType('REAL', {type: 'number'});
  _testType('SMALLINT', { type: 'integer'});
  _testType('STRING', { type: 'string'});
  _testType('STRING', 100, { type: 'string', maxLength: 100});
  _testType('STRING', 40, { type: 'string', maxLength: 40});
  _testType('TEXT', 'long', { type: 'string', maxLength: 4294967295 });
  _testType('TEXT', 'medium', { type: 'string', maxLength: 16777215 });
  _testType('TEXT', 'tiny', { type: 'string', maxLength: 255 });
});
