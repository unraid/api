# Notification counter appliance test

## Local burst and read-cost tests

From the repository root, run:

```sh
pnpm --filter ./api test src/unraid-api/graph/resolvers/notifications/notifications.load.spec.ts
CHOKIDAR_USEPOLLING=true pnpm --filter ./api test src/unraid-api/graph/resolvers/notifications/notifications.load.spec.ts
```

These tests use real temporary files, Chokidar events, notification readers,
and PubSub subscriptions. They cover creation of both native file copies,
content/severity changes, unread deletion revealing archive copies, and
archive-only creation. Fixtures include 1,000 unread plus 1,000 archive history
files and bursts of 24 or 100 notifications.

Each `notification-load` record reports file-content read attempts, warning/alert
scan count, peak simultaneous scans, and elapsed time. Measurement starts after
hydration and ends after handlers and payload publications finish. Ground-truth
list queries run afterward and do not inflate the recorded event cost. Read
attempts include missing-copy reads; they are not physical disk I/O measurements.
Watcher metadata reads and other processes are outside this measurement.

Assertions check final counters against full lists, final warning payloads,
deduplicated additions, no history recount, no reads of unrelated archived
payloads, and no more than two count reads per event plus the unread payload
scans. Archive-only bursts must trigger no warning/alert scans.

**These are cost-characterization tests, not a burst-performance approval.**
The current implementation starts a warning/alert scan per unread event. With
1,000 unread history files, a burst of 100 changes produced 110,200 content-read
attempts and 100 scans in a local run. Passing tests preserve notification
correctness and expose that amplification; they do not establish an acceptable
server latency or a constant read budget per burst. Elapsed times are diagnostic,
not machine-dependent CI limits. Appliance acceptance remains a separate step.

## Appliance setup

`notification-counter.mjs` tests the installed API against Unraid's native
`/usr/local/emhttp/webGui/scripts/notify`. Run it inside a disposable, managed
QA guest after installing the production-shaped plugin for the selected commit.
The guest must have `/boot/config/qa-harness-ok` and Node.js with native `fetch`.

The QA runner must establish the source commit and package digest before
installation. Extract the API entrypoint from that same package and calculate
its SHA-256. Supply that expected hash to the guest; do not calculate the
expected value from the guest's installed file. The script compares the
installed entrypoint with this hash and records the native notifier's hash.
This comparison covers the entrypoint. The runner remains responsible for
verifying the complete installed package and its revision.

Supply these environment variables through the managed guest execution path:

- `QA_GRAPHQL_URL`: authenticated local GraphQL endpoint for this guest.
- `QA_API_KEY`: temporary key with notification read, update, and delete permissions.
- `QA_API_ENTRYPOINT`: absolute installed API entrypoint path from the package.
- `QA_API_SHA256`: expected SHA-256 from the pinned package.
- `QA_SOURCE_REVISION`: full 40-character source commit for that package.
- `QA_REPORT_PATH`: fresh absolute path for the private JSON receipt.

Run `node /absolute/guest/path/notification-counter.mjs`. Use the QA VM
provider's current lifecycle and execution contract. Do not run this script on
a production server. The runner must restore and release the guest even when
the test fails, and remove its temporary API key.

The script uses `notify -i "<severity> 1"` to enable browser-file delivery only.
It does not change notification settings or invoke email and notification agents.
It creates uniquely named files and removes only those files in `finally`.
It verifies:

- All three severities through the actual notifier, including both unread and
  archive copies of each notification.
- Native archive actions, API restore, API archive over an existing copy, and API deletion.
- External severity changes and unread deletion that reveals the archive's severity.
- Native archive-only delivery and a burst of 24 native file writes.
- Matching cached counters, visible GraphQL lists, and independent disk counts
  after every step and after cleanup.

The script never calls `recalculateOverview`, so a watcher failure cannot be
hidden by a manual refresh. Each check allows 15 seconds for watcher delivery.
It stops if notification ground truth is ambiguous or a list reaches its
10,000-item cap. Existing notifications must have a supported importance value.
The receipt contains hashes, source revision, fixture counts, and check names;
it excludes credentials, the endpoint, and existing notification contents.

A syntax check is not appliance acceptance. Only a receipt with `status=passed`
and `cleanup=complete`, plus the runner's package and VM lifecycle evidence,
proves that this appliance test passed.

## Adversarial appliance pass

Set `QA_ADVERSARIAL=true` and `QA_ALLOW_SERVICE_RESTART=true` to run the extended
pass. This requires a disposable guest, an isolated empty notification directory,
and native notification settings `normal=1`, `warning=1`, and `alert=1`. The runner
must prepare those settings before restarting the API, preserve the original
configuration, and restore it afterward. The temporary API key also needs
notification creation permission. With the current CLI, use an alphanumeric key
name, an explicit `GUEST` role, and the four explicit notification permissions.

The extended pass checks API creation through the installed native script,
three authenticated GraphQL WebSocket subscriptions, content updates without
count changes, selected-ID and severity-filtered bulk archive/restore, all-item
archive/restore/deletion, persisted counts after service restart, subscription
reconnection, and recovery from a real startup directory failure without
another process restart.

It also temporarily lowers the guest's inotify watch limit, creates a watched
subdirectory, requires a logged `ENOSPC`, restores the original limit in
`finally`, and proves that the same API process still counts native writes.
The runner must restore and release the VM on every outcome. This fault test
must never run on a shared or production guest.

The receipt separately records whether the ID returned by native API creation
matches the actual disk record. A mismatch produces `passed_with_findings`,
which is not a clean regression verdict. The runner must report that finding
and establish whether it predates the candidate before deciding its scope.
