# Skill Dockyard command release guide

Use this guide to publish, verify, deprecate, or recover the `skill-dockyard` npm package. The package supports Node.js 22.12 and later. Never paste an npm token into the repository, a build log, or an issue.

## Release

1. Confirm the package name and version in `package.json` and update release notes.
2. From a clean checkout on Node.js 22, run:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run cli:build
   npm pack --dry-run
   ```

3. Install the packed artifact in an empty temporary directory and start every command with `--help`.
4. Commit the version change and release notes. Push the branch and wait for required checks.
5. Merge the reviewed release commit. Create the matching `v<version>` tag only from that commit.
6. Run the **Publish CLI** GitHub Actions workflow. It publishes with provenance. Use npm trusted publishing when available; otherwise use a narrowly scoped automation token stored only as the `NPM_TOKEN` repository secret.
7. Verify the public package from outside the repository:

   ```bash
   npx skill-dockyard@<version> --help
   npx skill-dockyard@<version> connect --help
   npm view skill-dockyard@<version> version dist.integrity dist.tarball
   ```

8. Test connect, import, check, update, and local-change protection against production with a dedicated test account. Revoke that connected computer when testing is complete.

## Compatibility policy

- The web API supports the current command version and the most recent compatible minor version during the initial release period.
- Additive response fields are allowed. Removing or renaming fields, changing authentication, or changing update semantics requires a command version release and a documented migration path.
- The updater must continue refusing to overwrite local changes. A server or command release must not weaken that protection.
- Raise the Node.js minimum only in a semver-major release unless an urgent security fix requires otherwise.

## Token revocation

Users revoke a connection under **Workspace settings → Connected computers**. Confirm the old bearer token receives `401` afterward. For a suspected credential leak, revoke the token first, inspect audit and access logs, and rotate any related provider secret using the incident runbook.

## Recovery and deprecation

npm releases are immutable. Do not attempt to replace an already published version.

- For a broken release that is not unsafe, publish a corrected patch version and update the `latest` dist-tag to it.
- For a version that is unsafe or can corrupt local state, deprecate that exact version with a short upgrade instruction, publish a fixed version, and notify affected users through the approved incident channel.
- Use `npm dist-tag` to move `latest` only after the replacement package passes the external verification above.
- Unpublishing is a last resort and requires Stephen's explicit approval because it can break existing installs.
- Record the affected version, replacement version, reason, timestamps, and verifier in the launch or incident record.

The web rollback process and broader credential response are in [production-operations-runbook.md](production-operations-runbook.md).
