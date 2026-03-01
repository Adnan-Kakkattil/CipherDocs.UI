## 10 - GraphQL introspection

### Goal
Use introspection to enumerate the schema.

### Endpoint
- `POST http://127.0.0.1:4000/api/graphql`

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query{ __schema { queryType { fields { name description } } } }\"}"
```

