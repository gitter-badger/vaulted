VERSION := $(shell jq .version package.json)
DOCKER_HOST_IP := $(shell docker-machine ip docker-host)
DOCKER_COMPOSE := "docker-compose-test.yml"

.PHONY: clean build run-local

node_modules:
	@npm install

test: node_modules
	@docker-compose -f $(DOCKER_COMPOSE) up -d && \
	sleep 3 && \
	CONSUL_HOST=$(DOCKER_HOST_IP) \
	CONSUL_PORT=8500 \
	VAULT_HOST=$(DOCKER_HOST_IP) \
	VAULT_PORT=8200 \
	mocha -R progress tests/**/*.js; \
	docker-compose -f $(DOCKER_COMPOSE) stop

test-watch: node_modules
	@mocha -G -R spec -w tests/**/*.js

run-local: node_modules
	@docker-compose rm -fv
	@docker-compose up
