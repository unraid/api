# CodeRabbit Fixes WIP

## Context

- Repo: unraid/api
- Branch: codex/fix-forked-plugin-publish
- PR: 2014
- PR URL: https://github.com/unraid/api/pull/2014
- Generated at: 2026-05-20T16:03:41Z

## Inputs Pulled

- [x] Unresolved CodeRabbit review threads pulled
- [x] Top-level CodeRabbit review notes pulled
- [x] Top-level actionable review-body comments extracted into queue

## Fix Queue

| Item ID | Type | File | Line | Summary | Status | Link | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CR-001 | thread | .github/workflows/upload-pr-plugin.yml | 31 | Pin mutable `uses:` action refs to immutable SHAs. | DONE | https://github.com/unraid/api/pull/2014#discussion_r3275010283 | `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/upload-pr-plugin.yml")'`; `rg -nP '^\\s*uses:\\s*[^@]+@(?!(?:[a-f0-9]{40})$).+' .github/workflows/upload-pr-plugin.yml` returned no matches. |
| EXT-001 | thread | .github/workflows/upload-pr-plugin.yml | 15 | Make workflow_run concurrency fallback unique when PR number is unavailable. | DONE | https://github.com/unraid/api/pull/2014#discussion_r3275030567 | `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/upload-pr-plugin.yml")'`. |
| CR-002 | thread | .github/workflows/push-staging-pr-on-close.yml | 50 | Avoid direct template interpolation of `inputs.pr_number` in shell. | DONE | https://github.com/unraid/api/pull/2014#discussion_r3275031746 | `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/push-staging-pr-on-close.yml")'`; direct `inputs.pr_number` use is limited to step `env`. |
| RVW-001 | review-body | top-level | n/a | Top-level review repeats CR-001 action pinning request. | DONE | https://github.com/unraid/api/pull/2014#pullrequestreview-4329727578 | Covered by CR-001. |
| RVW-002 | review-body | top-level | n/a | Top-level review repeats CR-002 and notes misleading `sed` `.*?` regex. | DONE | https://github.com/unraid/api/pull/2014#pullrequestreview-4329754125 | `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/push-staging-pr-on-close.yml")'`; `rg -n '\\.\\*\\?' .github/workflows/push-staging-pr-on-close.yml` returned no matches. |
| EXT-002 | follow-up | .github/workflows/push-staging-pr-on-close.yml | 197 | Pin close-out comment action because workflow now runs in privileged `pull_request_target` context. | DONE | n/a | `rg -nP '^\\s*uses:\\s*[^@]+@(?!(?:[a-f0-9]{40})$).+' .github/workflows/upload-pr-plugin.yml .github/workflows/push-staging-pr-on-close.yml` returned no matches. |

## Execution Log

### 1. Item: CR-001
- Action: Pin new upload workflow action refs to full SHAs.
- Validation: `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/upload-pr-plugin.yml")'`; `rg -nP '^\s*uses:\s*[^@]+@(?!(?:[a-f0-9]{40})$).+' .github/workflows/upload-pr-plugin.yml`.
- Result: Passed; no mutable action refs remain in `.github/workflows/upload-pr-plugin.yml`.

### 2. Item: EXT-001
- Action: Use `github.event.workflow_run.id` as the no-PR-number concurrency fallback.
- Validation: `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/upload-pr-plugin.yml")'`.
- Result: Passed; fallback is unique per workflow run.

### 3. Item: CR-002
- Action: Move workflow_dispatch PR number into a step environment variable and read it as shell data before validation.
- Validation: `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/push-staging-pr-on-close.yml")'`; inspected direct `inputs.pr_number` occurrences.
- Result: Passed; the user-controlled input is no longer interpolated directly into the shell script body.

### 4. Item: RVW-001
- Action: Marked duplicate top-level review-body item as covered by CR-001.
- Validation: Same evidence as CR-001.
- Result: Done.

### 5. Item: RVW-002
- Action: Replace misleading `.*?` sed pattern with a quoted-string character class.
- Validation: `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/push-staging-pr-on-close.yml")'`; `rg -n '\.\*\?' .github/workflows/push-staging-pr-on-close.yml`.
- Result: Passed; no misleading `.*?` remains.

### 6. Item: EXT-002
- Action: Pin `thollander/actions-comment-pull-request` to the current `v3` SHA.
- Validation: `ruby -e 'require "yaml"; ARGV.each { |f| YAML.load_file(f) }' .github/workflows/upload-pr-plugin.yml .github/workflows/push-staging-pr-on-close.yml`; targeted mutable-action scan.
- Result: Passed; no mutable action refs remain in the two changed workflows.

## Final Checks

- [x] Queue reviewed: no `TODO` left
- [x] Remaining `BLOCKED` items documented with reason
- [x] Re-pulled CodeRabbit threads and reviews
- [x] No unhandled top-level review-body comment remains

Final evidence:
- `coderabbit-review-data final 2014` returned `unresolved_coderabbit_threads	0`.
- Resolved fixed review threads `PRRT_kwDOC2VmQM6DhuxC`, `PRRT_kwDOC2VmQM6DhyZ8`, and `PRRT_kwDOC2VmQM6Dhym0`.
