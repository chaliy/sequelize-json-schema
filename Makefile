.PHONY: install


install:
	npm install sequelize # Peer dependency
	npm install

test:
	npm test

patch:
	npm version patch
	git push
	npm publish

minor:
	npm version minor
	git push
	npm publish

major:
	npm version major
	git push
	npm publish
