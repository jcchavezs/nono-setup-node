ACTIONLINT_VERSION ?= 1.7.12
TOOLS_DIR := $(CURDIR)/.tools/bin
ACTIONLINT := $(TOOLS_DIR)/actionlint

.PHONY: install-tools
install-tools: $(ACTIONLINT)

.PHONY: $(ACTIONLINT)
$(ACTIONLINT):
	@mkdir -p $(TOOLS_DIR)
	@curl -fsSL https://raw.githubusercontent.com/rhysd/actionlint/v$(ACTIONLINT_VERSION)/scripts/download-actionlint.bash \
		| bash -s -- $(ACTIONLINT_VERSION) $(TOOLS_DIR)

.PHONY: lint
lint:
	@$(ACTIONLINT) -color
