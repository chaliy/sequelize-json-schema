'use strict';

let expect = require('chai').expect;

let Sequelize = require('sequelize');
let definition = require('../src');

describe('sequelize-json-schema', () => {

  let sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite'
  });

  describe('definition', () => {

    it('should build definition for empty model', () => {

      let Empty = sequelize.define('empty', {});

      let def = definition(Empty);

      expect(def.type).to.be.equal('object');
      expect(def.properties).to.be.not.null;
      expect(def.properties.id).to.be.not.null;
    });

    it('should build definition for simple model', () => {

      let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        description: Sequelize.TEXT
      });

      let def = definition(Simple);

      expect(def.properties.title).to.exist;
      expect(def.properties.title.type).to.be.equal('string');
      expect(def.properties.description).to.exist;
      expect(def.properties.description.type).to.be.equal('string');

    });

    it('should build definition for simple model excluding private columns', () => {

      let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        password: {
          type: Sequelize.STRING
        }
      });

      let def = definition(Simple, {
        exclude: ['password']
      });

      expect(def.properties.title).to.exist;
      expect(def.properties.password).to.not.exist;

    });

    it('should build definition for simple model only for defined columns', () => {

      let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        password: {
          type: Sequelize.STRING
        },
        secret: Sequelize.INTEGER
      });

      let def = definition(Simple, {
        attributes: ['title', 'password'],
        exclude: ['password']
      });

      expect(def.properties.title).to.exist;
      expect(def.properties.password).to.not.exist;
      expect(def.properties.secret).to.not.exist;

    });

    it('should add required for non-null columns', () => {
      let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        password: {
          allowNull: false,
          type: Sequelize.STRING
        },
        secret: Sequelize.INTEGER
      });

      let def = definition(Simple);

      expect(def.properties.title).to.exist;
      expect(def.properties.password).to.exist;
      expect(def.required).to.be.an('array');
      expect(def.required).to.contain('password');
      expect(def.properties.secret).to.exist;
    });

  });



});
