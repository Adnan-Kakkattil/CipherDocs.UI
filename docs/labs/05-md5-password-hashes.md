## 05 - Unsalted MD5 password hashes

### Goal
Retrieve user hashes and identify weak credentials.

### Endpoint
- `GET http://127.0.0.1:4000/__debug/users`

### Example

```bash
curl -s -H "X-Debug-Key: nvault_debug_2024_internal" http://127.0.0.1:4000/__debug/users
```

### Expected result
User list that includes `passwordHash` values (MD5).

