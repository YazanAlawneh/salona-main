import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import Colors from '../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Footer from '../../../components/Footer/Footer';
import chatService from '../../../services/chatService';


interface ChatPreview {
  other_user_id: number;
  latest_message_sent: string;
  name?: string;
  image_url?: string;
  last_message?: string;
  unread_count?: number;
  other_user?: {
    name?: string;
    image_url?: string;
    avatar?: string;
  };
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

const UserChatListScreen = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    console.log('ChatListScreen mounted, hasToken:', !!token);
    console.log('User ID:', user?.id);
    loadChats();
  }, [token, user]);

  const loadChats = async () => {
    if (!token || !user?.id) {
      console.log('Missing token or user ID');
      return;
    }

    try {
      console.log('Loading chats...');
      console.log('Token available:', !!token);
      console.log('User ID:', user.id);
      console.log('Fetching chats for user:', user.id);
      setLoading(true);

      // First try to get chats from Firebase
      const availableChats = await chatService.getAvailableChats(user.id, false, token);
      console.log('Found chats:', availableChats.length);

      if (availableChats.length > 0) {
        console.log('Chats loaded from Firebase:', availableChats);
        // Map Firebase chat format to our ChatPreview format
        const mappedChats = availableChats.map(chat => ({
          other_user_id: chat.user_id,
          latest_message_sent: chat.last_message_time || new Date().toISOString(),
          name: chat.name,
          image_url: chat.image_url,
          last_message: chat.last_message,
          unread_count: chat.unread_count,
          other_user: chat.other_user
        })) as ChatPreview[];
        setChats(mappedChats);
        setLoading(false);
        return;
      }

      // If no chats from Firebase, try the API
      console.log('No chats from Firebase, trying API');
      const response = await fetch('https://bella-glam.com/api/get-chats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Response from get-chats:', JSON.stringify(data, null, 2));

      // Make sure we have an array of chats
      const chatArray = Array.isArray(data) ? data : [];
      console.log('Number of chats from API:', chatArray.length);

      // Fetch the latest message for each chat
      const chatsWithMessages = await Promise.all(
        chatArray.map(async (chat) => {
          try {
            console.log(`Fetching messages for user ${chat.other_user_id}`);
            const messageResponse = await fetch(`https://bella-glam.com/api/get-messages/${chat.other_user_id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (messageResponse.ok) {
              const messages = await messageResponse.json();
              console.log(`Messages API Response for user ${chat.other_user_id}:`, JSON.stringify(messages, null, 2));
              if (Array.isArray(messages) && messages.length > 0) {
                // Get the latest message
                const latestMessage = messages[0];
                return {
                  ...chat,
                  last_message: latestMessage.message,
                };
              }
            }
            return chat;
          } catch (error) {
            console.error(`Error fetching messages for user ${chat.other_user_id}:`, error);
            return chat;
          }
        })
      );

      console.log('Final chats with messages:', JSON.stringify(chatsWithMessages, null, 2));
      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chat: ChatPreview) => {
    console.log('Opening chat with user:', chat.other_user);
    navigation.navigate('ChatScreen', {
      user: {
        id: chat.other_user_id,
        name: chat.other_user?.name || `User ${chat.other_user_id}`,
        image_url: chat.other_user?.image_url || chat.other_user?.avatar
      }
    });
  };

  const renderChatItem = ({item}: {item: ChatPreview}) => {
    // Get the fallback image
    const fallbackImage = require('../../../assets/images/beautician1.png');

    // Determine the image source
    const imageSource = item.other_user?.image_url || item.other_user?.avatar
      ? { uri: item.other_user.image_url || item.other_user.avatar }
      : fallbackImage;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}>
        <Image
          source={imageSource}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.name}>{item.other_user?.name || `User ${item.other_user_id}`}</Text>
            <Text style={styles.time}>
              {new Date(item.latest_message_sent).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.lastMessage}>
            <Text style={styles.messageText} numberOfLines={1}>
              {item.last_message || 'No message preview available'}
            </Text>
            {item.unread_count ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={loadChats}>
          <Icon name="refresh" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="chat-bubble-outline" size={48} color={Colors.gold} />
          <Text style={styles.noChatsText}>No messages yet</Text>
          <Text style={styles.noChatsSubtext}>
            Your conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.other_user_id.toString()}
          contentContainerStyle={styles.chatList}
        />
      )}

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.gold,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  time: {
    fontSize: 12,
    color: Colors.gold,
  },
  lastMessage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: Colors.softGray,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadCount: {
    fontSize: 12,
    color: Colors.black,
    fontWeight: 'bold',
  },
  noChatsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 16,
  },
  noChatsSubtext: {
    fontSize: 14,
    color: Colors.softGray,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default UserChatListScreen;
