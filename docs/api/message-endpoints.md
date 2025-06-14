# Chat Message API Endpoints

This document describes the API endpoints related to chat messages in the application.

## Get Messages By Chat ID

Retrieves all messages that belong to a specific chat, ordered chronologically.

### Test Endpoint

```
GET /api/test-endpoints?chatId=<chat_id>
```

This endpoint is protected and requires authentication.

### Parameters

| Parameter | Type   | Description        | Required |
|-----------|--------|--------------------|----------|
| chatId    | string | ID of the chat     | Yes      |

### Response

```json
{
  "success": true,
  "chatId": "string",
  "messageCount": number,
  "messages": [
    {
      "id": "string",
      "content": "string",
      "role": "user|assistant",
      "createdAt": "timestamp",
      "chatId": "string",
      "parts": [{ "text": "string", "type": "text" }],
      // other message properties
    },
    // more messages
  ]
}
```

### Error Responses

| Status | Description                         |
|--------|-------------------------------------|
| 400    | Chat ID is missing                  |
| 401    | User is not authenticated           |
| 500    | Server error retrieving messages    |

### CURL Examples

#### Get Messages for a Chat

```bash
curl -X GET 'http://localhost:3004/api/test-endpoints?chatId=YOUR_CHAT_ID' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'
```

#### Using the Function Directly

The underlying database function can be imported and used directly in server components:

```typescript
import { getMessagesByChatId } from '@/lib/db/queries';

// Inside an async function
const messages = await getMessagesByChatId({ id: chatId });
```

### Implementation Details

The function uses Drizzle ORM to query the database:

```typescript
export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}
```

This function correctly retrieves all messages for a given chat ID, ordered by creation time in ascending order (oldest first).
