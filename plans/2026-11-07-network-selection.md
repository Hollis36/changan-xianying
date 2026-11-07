# Network-aware playback implementation plan

Goal: Select the better measured existing 1080P route and use real 4K buffering plus device decoding capability to decide auto quality before playback. No paid service, IP lookup, geolocation or third-party proxy.
Architecture: Keep one preloading video. network.js probes only two allowlisted copies of the same 1080P file with bounded Range requests (512KiB each, 4-second timeout). In parallel observe existing 4K buffer for 8 seconds and query MediaCapabilities with a 1-second timeout. This is a sample-based choice, not an optimal internet-routing guarantee. Manual resolution wins. Current mode and measurements appear in a collapsed playback-status disclosure.

- [x] Add unit tests for bounded probes, failed/timed-out routes, conservative quality selection, unsupported/unknown decoding.
- [x] Implement network.js pure decision functions and bounded I/O; no metrics leave browser.
- [x] Add player controller accessors to update known 1080P route and apply auto decisions while retaining pending playhead/play intent. Recover once to the other measured available route on 1080P error, no retry loop.
- [x] Integrate monitor/status disclosure/retest into site/main.js, HTML and CSS; build copies network.js. Version module URLs together.
- [x] Verify manual change cancels old detection; 1080P measurements never become a false 4K upgrade; fallback progress and paused state survive.
- [ ] Run all tests and build, independent code review, verify actual browser diagnostics. Push only reviewed built assets and verify successful Pages deployment and public behavior.
