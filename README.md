# nono-setup-node

[![test-install](https://github.com/jcchavezs/nono-setup-node/actions/workflows/test-install.yml/badge.svg)](https://github.com/jcchavezs/nono-setup-node/actions/workflows/test-install.yml)
[![test-sandbox](https://github.com/jcchavezs/nono-setup-node/actions/workflows/test-sandbox.yml/badge.svg)](https://github.com/jcchavezs/nono-setup-node/actions/workflows/test-sandbox.yml)

This action wraps [actions/setup-node](https://github.com/actions/setup-node) and runs Node.js inside the [nono](https://nono.sh) sandbox. It provides the following functionality for GitHub Actions users:

- Installing [nono](https://nono.sh) (and caching it by version)
- Everything `actions/setup-node` does: downloading and caching a Node.js distribution and adding it to the PATH, caching npm/yarn/pnpm dependencies, registering problem matchers and configuring authentication for GPR or npm
- Creating `node` and `npm` shims that are placed first in the PATH and run every invocation as `nono run --allow-cwd -- <node|npm> <args>`, so install scripts and any other code run by `node` or `npm` are sandboxed

## Usage

See [action.yml](action.yml)

```yaml
- uses: jcchavezs/nono-setup-node@main
  with:
    # Version of nono to install, as a release tag (e.g. v0.69.0).
    # Use "latest" to install the newest release; "latest" is never cached.
    # Default: v0.69.0
    nono-version: ''

    # Git ref (tag, branch or SHA) of actions/setup-node to use.
    # Default: v6
    setup-node-version: ''

    # All the inputs below are passed through to actions/setup-node.

    # Version Spec of the version to use in SemVer notation.
    # It also admits such aliases as lts/*, latest, nightly and canary builds
    # Examples: 12.x, 10.15.1, >=10.15.0, lts/Hydrogen, 16-nightly, latest, node
    node-version: ''

    # File containing the version Spec of the version to use.
    # Examples: package.json, .nvmrc, .node-version, .tool-versions.
    # If node-version and node-version-file are both provided the action will use version from node-version.
    node-version-file: ''

    # Set this option if you want the action to check for the latest available version
    # that satisfies the version spec.
    # Default: false
    check-latest: false

    # Target architecture for Node to use. Examples: x86, x64. Will use system architecture by default.
    # Default: ''
    architecture: ''

    # Used to pull node distributions from https://github.com/actions/node-versions.
    # Since there's a default, this is typically not supplied by the user.
    # Default: ${{ github.server_url == 'https://github.com' && github.token || '' }}
    token: ''

    # Used to specify a package manager for caching in the default directory. Supported values: npm, yarn, pnpm.
    # Package manager should be pre-installed
    # Default: ''
    cache: ''

    # Controls automatic caching for npm based on the packageManager field in package.json.
    # Set to false to disable it.
    # Default: true
    package-manager-cache: true

    # Path to a dependency file: package-lock.json, yarn.lock, etc.
    # It will generate hash from the target file for primary key. It works only if cache is specified.
    # Default: ''
    cache-dependency-path: ''

    # Optional registry to set up for auth. Will set the registry in a project level .npmrc and .yarnrc file,
    # and set up auth to read in from env.NODE_AUTH_TOKEN.
    # Default: ''
    registry-url: ''

    # Optional scope for authenticating against scoped registries.
    # Default: ''
    scope: ''

    # Set always-auth in npmrc.
    # Default: false
    always-auth: false

    # Optional mirror to download binaries from. Artifacts need to match the official Node.js.
    # Default: ''
    mirror: ''

    # Optional mirror token, used as a bearer token in the Authorization header.
    # Default: ''
    mirror-token: ''
```

For the details of each pass-through input, refer to the [actions/setup-node documentation](https://github.com/actions/setup-node#usage).

**Basic:**

```yaml
steps:
- uses: actions/checkout@v5
- uses: jcchavezs/nono-setup-node@main
  with:
    node-version: 24
- run: npm ci # runs as: nono run --allow-cwd -- npm ci
- run: npm test
```

## Outputs

| Output         | Description                                  |
|----------------|----------------------------------------------|
| `cache-hit`    | A boolean value to indicate if a cache was hit (from `actions/setup-node`). |
| `node-version` | The installed node version (from `actions/setup-node`). |

## How it works

1. **nono** is installed with `curl -fsSL https://nono.sh/install.sh | sh` into `$RUNNER_TEMP/nono-bin`, which is added to the PATH. When `nono-version` is a pinned tag, the directory is cached with `actions/cache` under the key `nono-<os>-<arch>-<nono-version>`, so the installer only runs on a cache miss. `latest` (or an empty value) always runs the installer and is never cached.
2. **actions/setup-node** is checked out at `setup-node-version` into `.nono-setup-node/setup-node` in the workspace and run as a local action (a composite action cannot use an expression in `uses:`) with all the inputs you provided.
3. **Shims** for `node` and `npm` are written to `$RUNNER_TEMP/nono-shims` and prepended to the PATH. Each shim resolves the real binary beforehand and executes `nono run --allow-cwd ${NONO_ARGS} -- <real binary> "$@"`.

> [!NOTE]
> The shims are bash scripts: Linux and macOS runners are supported, Windows runners are not.
>
> The `.nono-setup-node/` folder is created in the workspace and shows up as untracked in `git status`.

## Customizing the sandbox with `NONO_ARGS`

The content of the `NONO_ARGS` environment variable is passed to `nono run` every time a shim runs. It is split on whitespace, so arguments containing spaces are not supported. Use it to select a nono profile or grant extra access:

```yaml
env:
  NONO_ARGS: --profile ${{ github.workspace }}/nono-profile.json
steps:
- uses: actions/checkout@v5
- uses: jcchavezs/nono-setup-node@main
  with:
    node-version: 24
- run: npm ci
```

The profile below allows read access to one folder and denies another, on top of the built-in `node-dev` profile:

```json
{
  "meta": { "name": "my-profile" },
  "extends": "node-dev",
  "filesystem": {
    "read": ["$HOME/allowed"],
    "deny": ["$HOME/denied"]
  },
  "workdir": { "access": "readwrite" }
}
```

See the [nono profile guide](https://nono.sh) (`nono profile guide`) for the full schema.

## Pinning `actions/setup-node`

```yaml
- uses: jcchavezs/nono-setup-node@main
  with:
    setup-node-version: v5.0.0 # a tag, branch or commit SHA
    node-version: 22
```

## Tests

The [test workflows](.github/workflows) exercise the action:

- [test-install.yml](.github/workflows/test-install.yml) runs `npm install` for a given `package.json` (default [test/install](test/install)).
- [test-sandbox.yml](.github/workflows/test-sandbox.yml) runs `npm ci` for [test/sandbox](test/sandbox), whose `preinstall` script reads two folders: one allowed by the [nono profile](test/sandbox/nono-profile.json), which must succeed, and one denied by it, which must fail.
