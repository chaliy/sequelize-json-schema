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
      expect(def.required).to.contain('id');
      expect(def.required).to.contain('createdAt');
      expect(def.required).to.contain('updatedAt');
      expect(def.required).to.not.contain('title');
      expect(def.required).to.contain('password');
      expect(def.required).to.not.contain('secret');
      expect(def.properties.secret).to.exist;
    });

    it('should add null type if option allowNull turned on', () => {
       let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        password: {
          allowNull: true,
          type: Sequelize.STRING
        }
      });

      let def = definition(Simple, {
        allowNull: true
      });

      expect(def.properties.title).to.exist;
      expect(def.required).to.be.an('array');
      expect(def.required).to.contain('id');
      expect(def.required).to.contain('createdAt');
      expect(def.required).to.contain('updatedAt');
      expect(def.required).not.to.contain('title');
      expect(def.required).not.to.contain('password');
      expect(def.properties.password.type).to.eql(['string', 'null'])
      expect(def.properties.title.type).to.eql('string')
    })

    it('should add to required if option allowNull and alwaysRequired turned on', () => {
       let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        password: {
          allowNull: true,
          type: Sequelize.STRING
        }
      });

      let def = definition(Simple, {
        allowNull: true,
        alwaysRequired: true
      });

      expect(def.properties.title).to.exist;
      expect(def.required).to.be.an('array');
      expect(def.required).to.contain('id');
      expect(def.required).to.contain('createdAt');
      expect(def.required).to.contain('updatedAt');
      expect(def.required).to.contain('title');
      expect(def.required).to.contain('password');
      expect(def.properties.password.type).to.eql(['string', 'null'])
      expect(def.properties.title.type).to.eql('string')
    })

    it('should specify string length', () => {
      let Simple = sequelize.define('simple', {
        title: Sequelize.STRING,
        tinyTitle: Sequelize.TEXT('tiny'),
        mediumTitle: Sequelize.TEXT('medium'),
        longTitle: Sequelize.TEXT('long'),
        password: {
          type: Sequelize.STRING(100)
        },
        secret: Sequelize.STRING(40)
      });

      let def = definition(Simple);

      expect(def.properties.title).to.exist;
      expect(def.properties.title.maxLength).to.equal(255);
      expect(def.properties.tinyTitle).to.exist;
      expect(def.properties.tinyTitle.maxLength).to.equal(255);
      expect(def.properties.mediumTitle).to.exist;
      expect(def.properties.mediumTitle.maxLength).to.equal(16777215);
      expect(def.properties.longTitle).to.exist;
      expect(def.properties.longTitle.maxLength).to.equal(4294967295);
      expect(def.properties.password).to.exist;
      expect(def.properties.password.maxLength).to.equal(100);
      expect(def.properties.secret).to.exist;
      expect(def.properties.secret.maxLength).to.equal(40);
    });

    it('should include provided examples', () => {
      let Simple = sequelize.define('simple', {
        title: {
          type: Sequelize.STRING,
          example: '10 Shocking Things That Go Viral'
        },
        articleId: {
          type: Sequelize.INTEGER,
          example: 42
        },
        tags: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          example: ['clickbait', 'viral', 'article']
        }
      });

      let def = definition(Simple);
      expect(def.properties.title).to.exist;
      expect(def.properties.title.example).to.equal('10 Shocking Things That Go Viral');
      expect(def.properties.articleId).to.exist;
      expect(def.properties.articleId.example).to.equal(42);
      expect(def.properties.tags).to.exist;
      expect(def.properties.tags.example).to.exist;
      expect(def.properties.tags.example).to.be.an('array');
      expect(def.properties.tags.example).to.contain('clickbait');
      expect(def.properties.tags.example).to.contain('viral');
      expect(def.properties.tags.example).to.contain('article');
    });
  });



});
