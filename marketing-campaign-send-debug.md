# Marketing Campaign Send Issue (Frontend -> Backend)

## Summary
When sending a campaign from the frontend, the backend responds with `sent: 0`, so no email is delivered. The frontend only displays what the backend returns.

## Frontend File (Source of Requests)
- `src/pages/marketing/campaigns/list.vue`

## Create Campaign Request (Frontend)
Endpoint:
- `POST /marketing`

Payload:
```json
{
  "businessId": <number>,
  "name": "...",
  "targetSegment": "vip" | "regular" | "all",
  "channel": "email" | "sms" | "push",
  "startDate": "YYYY-MM-DDT00:00:00",
  "endDate": "YYYY-MM-DDT00:00:00"
}
```

Notes:
- Frontend normalizes `targetSegment` + `channel` to lowercase.
- Dates are normalized to `YYYY-MM-DDT00:00:00`.

## Send Campaign Request (Frontend)
Endpoint:
- `POST /marketing/{campaign_id}/send`

Payload:
```json
{
  "subject": "...",
  "body": "...",
  "campaignId": <number>,
  "businessId": <number>,
  "channel": "email",
  "targetSegment": "vip" | "regular"   // omitted when segment = "all"
}
```

Important:
- If the campaign segment is **all**, the frontend **omits** `targetSegment` entirely.
- The frontend expects the backend to treat missing `targetSegment` as "all recipients".

## Frontend Success/Error Logic
- Frontend reads:
  - `response.data.sent` or `response.sent`
- If `sent > 0` ? shows "Campaign email sent (X)."
- If `sent == 0` ? shows "Send succeeded but 0 recipients. Check segment or customers."

## Backend Fix Checklist
1. **Segment Handling**
   - If `targetSegment` is **missing**, treat as **ALL customers**.
   - If backend expects `targetSegment = null` or `"all"`, normalize missing to that value.

2. **Customer Matching**
   - Make sure customers exist for the given `businessId`.
   - Ensure customer `segment` matches `vip` or `regular` (case-sensitive check?).
   - Ensure customer has a valid `email`.

3. **Channel Handling**
   - Frontend sends `channel = "email"` (lowercase).
   - Backend should accept lowercase values.

4. **Return Value**
   - Ensure backend returns `sent` count correctly.

## Quick Backend Test
- Create campaign for businessId with known customers.
- Send without `targetSegment` and confirm it sends to all.

## Expected Backend Response Example
```json
{
  "success": true,
  "status_code": 200,
  "message": "Campaign emails sent",
  "data": { "sent": 3, "segment": "all" }
}
```
