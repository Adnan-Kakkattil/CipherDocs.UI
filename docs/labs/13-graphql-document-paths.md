## 13 - Document path disclosure via GraphQL

### Goal
Enumerate documents and discover server-side file paths.

### Example

```bash
curl -s http://127.0.0.1:4000/api/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query{ documents { id title ownerId filename filePath category classification } }\"}"
```

