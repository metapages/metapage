# The dash prepended to the "include" command prevents make from exiting if the file does not exist
-include .env

COMPOSE_PUSH_BUILDER = builder haxe

# No make commands are defined in the base Makefile to ensure it is generic/not project specific
include etc/makefiles/*.mk
