.PHONY: install


install:
	npm install sequelize # Peer dependency
	npm install

test:
	npm test
