import { ref, onValue, push, set, get, getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';

interface Message {
  message: string;
  receiver_id: number;
  sender_id: number;
  time: string;
}

interface ChatPreview {
  user_id: number;
  name: string;
  image_url: string;
  last_message: string;
  last_message_time: string;
  unread_count?: number;
}

const firebaseConfig = {
  apiKey: "AIzaSyDKplQEnueX8njxb1Si1Zc7tLMn5mp-deM",
  authDomain: "spa1-46f3d.firebaseapp.com",
  databaseURL: "https://spa1-46f3d-default-rtdb.firebaseio.com",
  projectId: "spa1-46f3d",
  storageBucket: "spa1-46f3d.firebasestorage.app",
  messagingSenderId: "218571464302",
  appId: "1:218571464302:web:f501f4a1c6d6941e61907f",
  measurementId: "G-XHCYGWWCKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

class ChatService {
  private static instance: ChatService;
  // Previous API URL (commented out)
  // private API_URL = 'https://spa.dev2.prodevr.com/api';
  
  // New API URL
  private API_URL = 'https://bella-glam.com/api';

  private constructor() {
    console.log('ChatService initialized');
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private getChatId(userId: number, providerId: number): string {
    // Format: smaller_id_larger_id to ensure consistency
    return userId < providerId 
      ? `${userId}_${providerId}`
      : `${providerId}_${userId}`;
  }

  // Get list of available chats from Firebase
  async getAvailableChats(providerId: number, isProvider: boolean, token: string): Promise<ChatPreview[]> {
    try {
      console.log('Fetching chats for provider:', providerId);
      const chatsRef = ref(database, 'chats');
      const snapshot = await get(chatsRef);
      
      if (!snapshot.exists()) {
        console.log('No chats found in Firebase');
        return [];
      }

      const chats: ChatPreview[] = [];
      const allChats = snapshot.val();

      // Iterate through all chats
      for (const chatId in allChats) {
        const [id1, id2] = chatId.split('_').map(Number);
        
        // Only include chats where the provider is a participant
        if (id1 === providerId || id2 === providerId) {
          const otherUserId = id1 === providerId ? id2 : id1;
          const messages = Object.values(allChats[chatId]);
          
          // Sort messages by time to get the latest
          const sortedMessages = messages.sort((a: any, b: any) => 
            new Date(b.time).getTime() - new Date(a.time).getTime()
          );
          
          if (sortedMessages.length > 0) {
            const lastMessage = sortedMessages[0] as Message;
            
            // Get user details from your API
            try {
              const userResponse = await fetch(`${this.API_URL}/users/${otherUserId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                }
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                chats.push({
                  user_id: otherUserId,
                  name: userData.name || 'Unknown User',
                  image_url: userData.image_url || '',
                  last_message: lastMessage.message,
                  last_message_time: lastMessage.time,
                  unread_count: 0 // You can implement unread count logic if needed
                });
              }
            } catch (error) {
              console.error('Error fetching user details:', error);
              // Still add chat with limited information
              chats.push({
                user_id: otherUserId,
                name: `User ${otherUserId}`,
                image_url: '',
                last_message: lastMessage.message,
                last_message_time: lastMessage.time,
                unread_count: 0
              });
            }
          }
        }
      }

      console.log('Found chats:', chats.length);
      return chats;
    } catch (error) {
      console.error('Error fetching chats from Firebase:', error);
      throw new Error('Failed to fetch chat list');
    }
  }

  // Subscribe to messages for a specific chat
  subscribeToMessages(userId: number, otherId: number, callback: (messages: Message[]) => void): () => void {
    const chatId = this.getChatId(userId, otherId);
    const chatRef = ref(database, `chats/${chatId}`);
    
    console.log('Subscribing to chat:', chatId);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const messages: Message[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          messages.push(message);
        });
        
        // Sort messages by time
        messages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      }
      
      callback(messages);
    }, (error) => {
      console.error('Error subscribing to messages:', error);
    });

    return unsubscribe;
  }

  // Send message and store in Firebase
  async sendMessage(message: string, receiverId: number, token: string, senderId: number, isProvider: boolean = false): Promise<boolean> {
    try {
      console.log('Sending message:', { message, receiverId, senderId });

      // Store in Firebase
      const chatId = this.getChatId(senderId, receiverId);
      const chatRef = ref(database, `chats/${chatId}`);
      const newMessageRef = push(chatRef);

      const messageData: Message = {
        message,
        sender_id: senderId,
        receiver_id: receiverId,
        time: new Date().toISOString(),
      };

      await set(newMessageRef, messageData);
      console.log('Message stored in Firebase');

      // Also send through API if needed
      try {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('receiver_id', receiverId.toString());

        await fetch(`${this.API_URL}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } catch (apiError) {
        console.error('Error sending message through API (but stored in Firebase):', apiError);
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Get messages for a specific chat from Firebase
  async getMessages(userId: number, otherId: number, isProvider: boolean, token: string): Promise<Message[]> {
    try {
      console.log('Getting messages from Firebase for chat:', userId, otherId);
      const chatId = this.getChatId(userId, otherId);
      const chatRef = ref(database, `chats/${chatId}`);
      const snapshot = await get(chatRef);
      
      if (!snapshot.exists()) {
        console.log('No messages found in Firebase for chat:', chatId);
        return [];
      }

      const messages: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        messages.push(message);
      });
      
      // Sort messages by time
      messages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      console.log('Found messages in Firebase:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error getting messages from Firebase:', error);
      return [];
    }
  }
}

export default ChatService.getInstance(); 