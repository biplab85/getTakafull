# GetTakaful API Reference

Base URL: `http://localhost:8000/api`

## Authentication

All protected endpoints require `Authorization: Bearer {token}` header.

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns token) |
| POST | `/auth/send-otp` | Send OTP to email |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/forgot-password` | Send new password via email |
| GET | `/groups/token/{token}` | Get group info by invite token |

### Protected Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/logout` | Logout (revoke token) |
| GET | `/auth/user` | Get current user |
| PUT | `/auth/profile` | Update profile (multipart/form-data) |
| PUT | `/auth/password` | Change password |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Dashboard stats (4 cards) |
| GET | `/dashboard/pending-votes` | Claims needing user's vote |
| GET | `/dashboard/recent-claims` | User's recent claims |

#### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups/my` | Groups created by user |
| GET | `/groups/joined` | Groups user has joined |
| POST | `/groups` | Create new group |
| GET | `/groups/{id}` | Group detail |
| POST | `/groups/{id}/join` | Join a group |
| POST | `/groups/{id}/invite` | Invite by emails |
| GET | `/groups/{id}/claims` | List group claims |

#### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/claims` | Submit claim (multipart/form-data) |
| GET | `/claims/{id}` | Claim detail with voting info |
| POST | `/claims/{id}/vote` | Vote on a claim |

---

## Request/Response Examples

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// Response
{ "user": { "id": 1, "first_name": "John", ... }, "token": "1|abc..." }
```

### POST /groups
```json
// Request
{
  "name": "Auto Insurance Pool",
  "description": "Community auto takaful",
  "amount_to_join": 500,
  "minimum_members": 10,
  "management_fee": 25,
  "claims_processing_fee": 15,
  "shariah_compliance_review_fee": 10,
  "platform_fee": 20,
  "rules": "<p>Terms and conditions...</p>"
}
```

### POST /claims/{id}/vote
```json
// Request
{ "decision": "approved", "comment": "Looks legitimate" }
```
