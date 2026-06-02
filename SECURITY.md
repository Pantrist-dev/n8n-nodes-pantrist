# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security bugs.

Email **info@pantrist.app** with:

- a short description of the issue,
- steps to reproduce (or a proof of concept),
- the affected `n8n-nodes-pantrist` version (and your n8n version),
- whether the vulnerability is already public.

You should get an acknowledgement within **5 working days**. For confirmed
issues we aim to ship a fix within **30 days**; critical issues get an
out-of-band release.

## Scope

In scope:

- Credential leaks (the API key surfacing in error messages, logs, or stored
  workflow data),
- Crashes or hangs triggered by responses from the Pantrist API,
- Anything that lets one n8n user read or modify another user's Pantrist data.

Out of scope:

- Bugs in n8n itself — please report those to
  <https://github.com/n8n-io/n8n>.
- Bugs in the Pantrist backend — please report those to
  <info@pantrist.app> directly; they are not part of this package.

## Supported versions

Only the latest minor on npm is actively supported. Older versions receive
fixes only for critical issues.
