# Notification counter appliance test

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
