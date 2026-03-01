## 06 - Weak password policy

### Goal
Create an account using a weak/short password.

### Endpoint (GraphQL)
- `POST http://127.0.0.1:4000/api/graphql`

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation{ register(username:\\\"test1\\\",email:\\\"test1@local\\\",password:\\\"1234\\\"){ token user{ id username } } }\"}"
```

