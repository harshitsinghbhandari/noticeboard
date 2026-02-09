# Messaging Usage Guide

This guide details the direct messaging capabilities of the platform.

## 1. Messaging Overview
The messaging system provides **1:1 direct communication** between users. It is designed for private discussions and coordination within the campus community.
- **Supported:** 1:1 text-based messages.
- **Not Supported:** Group chats, club-to-user messaging (as a club entity), and real-time voice/video.

## 2. Starting a Conversation
### Initiation
A conversation is initiated by sending the first message to another user's UUID.
### Preconditions
There are **no connection requirements** to send a message; any authenticated user can message any other user if they know their unique ID.
### UI Access
Currently, there is **no "New Message" button** in the user interface. New conversations must be started via the API:
- **Route:** `POST /messages`
- **Required Body:**
  ```json
  {
    "receiver_id": "TARGET_USER_UUID",
    "message_text": "Hello!"
  }
  ```
Users can find another student's UUID by visiting their profile page and extracting it from the URL (`/profile/<uuid>`).

## 3. Conversation Model
Messages are stored individually in the `messages` table. The system dynamically generates a list of "Conversations" for each user by grouping messages by the "other" participant.
- Each conversation entry shows the most recent message, its timestamp, and the name of the other user.
- Conversations are ordered with the most recent activity at the top.

## 4. Sending Messages
### Via UI
1. Navigate to the **Messages** tab (`/messages`).
2. Select an existing conversation from the sidebar.
3. Type your message in the input field at the bottom.
4. Click **Send** or press **Enter**.
### Via API
- **Route:** `POST /messages`
- **Fields:** `receiver_id`, `message_text`, and optionally `attachment_url`.

## 5. Receiving Messages
### Polling
The frontend does not use WebSockets for real-time delivery. Instead, it uses **5-second polling**. When a conversation is selected, the application automatically refreshes the chat history every 5 seconds to fetch new messages.
### Visibility
New messages appear in the chat area as they are received. Messages sent by you are aligned to the right (blue), while received messages are aligned to the left (gray).

## 6. Message Visibility & Access Control
- **Access:** A user can only access message history for a conversation where they are either the `sender_id` or the `receiver_id`.
- **Enforcement:** The `getChat` repository function strictly filters messages by both participant IDs to ensure privacy.
- **Blocking:** There is currently no "Block" feature implemented; any user can message another as long as they have their UUID.

## 7. Notifications for Messages
Currently, the system **does not trigger notifications** for new messages. Users must check the Messages tab manually to see if they have received any new communication.

## 8. Message History
- **Persistence:** All messages are persisted in the database indefinitely.
- **Ordering:** Messages are displayed in chronological order (oldest at the top, newest at the bottom).
- **Pagination:** There is currently no pagination or limit on the number of messages fetched; the entire history with a user is loaded at once.
- **Deletion:** There is no feature to delete individual messages or entire conversations.

## 9. Error Cases
- **Failed Send:** If a message fails to send (e.g., due to network issues), an error is logged to the console, and the message will not appear in the chat.
- **Invalid Access:** Attempting to fetch a chat you are not part of will result in an empty list or an unauthorized error if tried via direct API manipulation.
- **Empty Conversations:** If no messages exist between two users, the conversation will not appear in the sidebar list.

## 10. Known Limitations
- **UI Initiation:** Inability to start a new chat directly from the UI or a user's profile.
- **Real-time:** Lack of real-time push notifications or WebSocket-based updates (reliant on 5s polling).
- **Attachments:** The backend supports `attachment_url`, but there is **no UI component** to upload or view attachments.
- **Status Indicators:** No "Typing..." indicators or "Delivered" statuses. "Read" status is tracked in the database but not visually indicated in the UI.
- **Search:** No ability to search within messages or for specific conversations.
