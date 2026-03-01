## 01 - Source comments reconnaissance

### Goal
Find internal notes and hidden endpoints by viewing the home page source.

### Steps
1. Start the web app and open `http://localhost:3000/`.
2. Use **View Page Source** in your browser.
3. Search for `Internal notes:` and `Known issues (backlog)`.

### What to look for
- Debug endpoints: `/__debug/config`, `/__debug/users`, `/__debug/logs`
- Internal admin API: `/api/v1/internal/admin`
- Headers/keys referenced in the comment block

