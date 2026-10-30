# Step 2 · handoff self-test · 2026-10-30 (07:41–07:42 UTC)

Dummy file only (`test:true`, `TEST-DUMMY-NOT-A-COVENANT-n`, no keys). No genesis, no transactions, kaspad untouched.

| Check | Result |
|---|---|
| Mini → desk push over LAN HTTP (Node receiver, user-level, no admin) | PASS · 52 ms (push), 129 ms wall |
| sha256 verified on both ends | PASS · `1837419d…bb47` both |
| Wrong token rejected | PASS · 403 `bad_token` |
| Guard: good file (with `-AllowTest`) | PASS · allowed (exit 0) |
| Guard: test file without `-AllowTest` | PASS · refused (16) |
| Guard: tampered body | PASS · refused `sha_mismatch` (12) |
| Guard: stale (created 29 Oct) | PASS · refused (14) |
| Guard: missing | PASS · refused (10) |
| Clock offset logged at start | desk −89 ms (ahead), mini +43 ms |

29 Oct cause: the mini had no route to push to the desk/box (`handoff_copy no_route_to_desk_or_box`); the desk has no SMB share or sshd, and no admin to add one. The Node receiver uses Node's existing Private-profile firewall rule.
