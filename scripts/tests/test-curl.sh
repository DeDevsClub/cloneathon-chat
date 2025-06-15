#!/bin/bash

# Generate random UUIDs for IDs
PROJECT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
CHAT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
MESSAGE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Print test information
echo "Testing chat API with project integration"
echo "----------------------------------------"
echo "Project ID: $PROJECT_ID"
echo "Chat ID: $CHAT_ID"
echo "Message ID: $MESSAGE_ID"
echo ""

# Create payload for the request
read -r -d '' PAYLOAD << EOM
{
  "id": "$CHAT_ID",
  "projectId": "$PROJECT_ID",
  "message": {
    "id": "$MESSAGE_ID",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "role": "user",
    "content": "Hello, can you help me test the chat functionality?",
    "parts": [
      {
        "type": "text",
        "text": "Hello, can you help me test the chat functionality?"
      }
    ]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "private"
}
EOM

# Save payload to a file for inspection
echo "$PAYLOAD" > /tmp/chat-test-payload.json
echo "Payload saved to /tmp/chat-test-payload.json"

# Make the API request
echo "Sending request to /api/chats..."
curl -X POST "http://localhost:3000/api/chats" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -v

echo ""
echo "----------------------------------------"
echo "Test URL (if successful): http://localhost:3000/chats/$CHAT_ID"
