## 17 - IDOR: document comments

### Goal
Read (and add) comments for a document you don’t own.

### Endpoints
- `GET http://127.0.0.1:4000/documents/:id/comments`
- `POST http://127.0.0.1:4000/documents/:id/comments`

### Examples

```bash
curl -s \
  -H "Authorization: Bearer <TOKEN>" \
  http://127.0.0.1:4000/documents/1/comments
```

```bash
curl -s \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"body\":\"reviewed\"}" \
  http://127.0.0.1:4000/documents/1/comments
```

