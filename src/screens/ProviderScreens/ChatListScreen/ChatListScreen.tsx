import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import Colors from '../../../constants/Colors';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from '../../../contexts/TranslationContext';

// Updated interface to match the current API response
interface ChatPreview {
  other_user_id: number;
  latest_message_sent: string;
  // These will be populated later when the backend is updated
  name?: string;
  image_url?: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

const ChatListScreen = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useSelector((state: RootState) => state.auth.token);
  const {t} = useTranslation();

  useEffect(() => {
    console.log('ChatListScreen mounted, hasToken:', !!token);
    loadChats();
  }, [token]);

  const loadChats = async () => {
    if (!token) {
      console.log('Missing token for loading chats');
      return;
    }

    try {
      console.log('Loading chats from API');
      setLoading(true);

      const response = await fetch('https://bella-glam.com/api/get-chats', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received chats:', data);

      // Make sure we have an array of chats
      const chatArray = Array.isArray(data) ? data : [];

      // Fetch the latest message for each chat
      const chatsWithMessages = await Promise.all(
        chatArray.map(async chat => {
          try {
            const messageResponse = await fetch(
              `https://bella-glam.com/api/get-messages/${chat.other_user_id}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (messageResponse.ok) {
              const messages = await messageResponse.json();
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
            console.error(
              `Error fetching messages for user ${chat.other_user_id}:`,
              error,
            );
            return chat;
          }
        }),
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (userId: number) => {
    console.log('Opening chat with user ID:', userId);
    navigation.navigate(
      'ProviderChatScreen' as never,
      {
        user: {
          id: userId,
          name: `User ${userId}`, // Placeholder name until backend provides it
          image_url: 'https://via.placeholder.com/50', // Placeholder image until backend provides it
        },
      } as never,
    );
  };

  const renderChatItem = ({item}: {item: ChatPreview}) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item.other_user_id)}>
      <Image
        source={{uri: item.image_url || 'https://via.placeholder.com/50'}}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>
            {item.name || `User ${item.other_user_id}`}
          </Text>
          <Text style={styles.time}>
            {new Date(item.latest_message_sent).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.lastMessage}>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.last_message || t.chatList.noMessagePreview}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.chatList.title}</Text>
        <TouchableOpacity onPress={loadChats}>
          <Icon name="refresh" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>{t.chatList.loading}</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="chat-bubble-outline" size={48} color={Colors.gold} />
          <Text style={styles.noChatsText}>{t.chatList.noMessages}</Text>
          <Text style={styles.noChatsSubtext}>
            {t.chatList.noMessagesSubtext}
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

      <ProviderFooter />
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
  loadingText: {
    fontSize: 16,
    color: Colors.gold,
    marginTop: 16,
  },
});

export default ChatListScreen;
