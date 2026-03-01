## 14 - IDOR: document view

### Goal
Access another user’s document metadata by changing the numeric document ID.

### Endpoint
- `GET http://127.0.0.1:4000/documents/:id`

### Steps
1. Login in the UI and open DevTools → Application → Local Storage to copy `cipherdocs_token`.
2. Request your own document ID, then change the ID to a different value.

### Example

```bash
curl -s \
  -H "Authorization: Bearer <TOKEN>" \
  http://127.0.0.1:4000/documents/1
```

