# Changesets

This folder is managed by the [@changesets/cli](https://github.com/changesets/changesets) tool.

## Writing a changeset

Run `pnpm changeset` and follow the prompts to select affected packages, a semver level (major/minor/patch), and a one-line description. Commit the generated `.changeset/*.md` file together with your code changes.

On version day, `pnpm changeset version` consumes these files to bump versions and generate CHANGELOGs; `pnpm changeset publish` publishes packages in topological order.
