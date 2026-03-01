## 07 - Brute-force friendly login behavior

### Goal
Observe how login responses differ between “user not found” and “invalid password”.

### Endpoint (GraphQL)
- `POST http://127.0.0.1:4000/api/graphql`

### Notes
- There is no lockout / rate limiting.
- Error messages differ, which helps automate guessing.

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{ login(username:\\\"admin\\\",password:\\\"wrong\\\"){ token user{ id } } }\"}"
```

