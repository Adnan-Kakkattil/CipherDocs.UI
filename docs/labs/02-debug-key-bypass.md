## 02 - Debug header key access

### Goal
Access debug endpoints using the `X-Debug-Key` header.

### Endpoint
- `GET http://127.0.0.1:4000/__debug/config`

### Steps
1. Send a request without the header; observe `401`.
2. Send the request again with:
   - `X-Debug-Key: nvault_debug_2024_internal`

### Example

```bash
curl -s -H "X-Debug-Key: nvault_debug_2024_internal" http://127.0.0.1:4000/__debug/config
```

### Expected result
JSON containing environment/config details and internal endpoints.

