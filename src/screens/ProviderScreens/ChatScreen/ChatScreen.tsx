import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../constants/Colors';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import chatService from '../../../services/chatService';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';

interface Message {
  id?: number;
  message: string;
  sender_id: number;
  receiver_id: number;
  time: string;
  created_at?: string;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {user} = route.params as {
    user: {id: number; name: string; image_url: string};
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const provider = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!provider?.id || !user.id || !token) {
      console.log('Missing required data:', {
        providerId: provider?.id,
        userId: user.id,
        hasToken: !!token,
      });
      return;
    }

    console.log('Setting up chat subscription:', {
      providerId: provider.id,
      userId: user.id,
    });

    // Subscribe to real-time messages from Firebase first
    const unsubscribe = chatService.subscribeToMessages(
      provider.id,
      user.id,
      firebaseMessages => {
        console.log(
          'Received messages update from Firebase:',
          firebaseMessages,
        );

        // Merge Firebase messages with existing messages
        setMessages(prevMessages => {
          const allMessages = [...prevMessages];

          // Process Firebase messages - handle both array and object formats
          const messagesToProcess = Array.isArray(firebaseMessages)
            ? firebaseMessages
            : Object.values(firebaseMessages);

          let hasNewMessages = false;
          messagesToProcess.forEach((msg: any) => {
            const firebaseMsg: Message = {
              message: msg.message,
              sender_id: parseInt(msg.sender_id),
              receiver_id: parseInt(msg.receiver_id),
              time: msg.time,
            };

            // Check if message already exists
            const existingIndex = allMessages.findIndex(
              m =>
                m.time === msg.time &&
                m.sender_id === parseInt(msg.sender_id) &&
                m.message === msg.message,
            );

            if (existingIndex === -1) {
              allMessages.push(firebaseMsg);
              hasNewMessages = true;
            }
          });

          if (!hasNewMessages) {
            return prevMessages;
          }

          // Sort all messages by time (oldest first)
          const sortedMessages = allMessages.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          );
          console.log('Updated messages:', sortedMessages.length, 'messages');
          return sortedMessages;
        });
      },
    );

    // Then fetch older messages from the API
    fetchOlderMessages();

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up chat subscription');
      unsubscribe();
    };
  }, [user.id, provider?.id, token]);

  const fetchOlderMessages = async () => {
    if (!provider?.id || !user.id || !token) {
      console.log('Missing required data for fetching messages');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching messages from API for user:', user.id);

      const response = await fetch(
        `https://bella-glam.com/api/get-messages/${user.id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received messages from API:', data.length);

      // Convert API messages to the format expected by the component
      const apiMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        time: msg.created_at || msg.time,
      }));

      // Sort messages by time (oldest first)
      apiMessages.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
      );

      // Update messages while preserving any Firebase messages
      setMessages(prevMessages => {
        const allMessages = [...apiMessages, ...prevMessages];
        // Remove duplicates based on time and content
        const uniqueMessages = allMessages.filter(
          (msg, index, self) =>
            index ===
            self.findIndex(
              m =>
                m.time === msg.time &&
                m.sender_id === msg.sender_id &&
                m.message === msg.message,
            ),
        );
        // Sort all messages
        return uniqueMessages.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );
      });

      setHasMoreMessages(apiMessages.length >= 20); // Assuming 20 is the page size
    } catch (error) {
      console.error('Error fetching messages from API:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages) return;

    try {
      setLoadingMore(true);
      // Here you would implement pagination to load older messages
      // For now, we'll just set hasMoreMessages to false
      setHasMoreMessages(false);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !provider?.id || !token) {
      console.log('Cannot send message:', {
        hasMessage: !!newMessage.trim(),
        providerId: provider?.id,
        hasToken: !!token,
      });
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');

    console.log('Attempting to send message:', {
      text: messageText,
      to: user.id,
      from: provider.id,
    });

    // Send message through service
    const sent = await chatService.sendMessage(
      messageText,
      user.id,
      token,
      provider.id,
      true,
    );

    if (!sent) {
      console.error('Failed to send message');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } else {
      console.log('Message sent successfully');
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isProvider = item.sender_id === provider?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isProvider ? styles.providerMessage : styles.userMessage,
        ]}>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={Colors.gold} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Image
          source={{uri: user.image_url || 'https://via.placeholder.com/40'}}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user.name}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => {
            // Create a unique key using multiple message properties
            return `${item.time}_${item.sender_id}_${item.message}`;
          }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={Colors.softGray}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}>
          <Icon
            name="send"
            size={24}
            color={newMessage.trim() ? Colors.black : Colors.softGray}
          />
        </TouchableOpacity>
      </View>

      <ProviderFooter />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
  },
  backButton: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  providerMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.gold,
  },
  userMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.softGray,
  },
  messageText: {
    color: Colors.black,
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.softGray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
  },
  input: {
    flex: 1,
    minHeight: 36,
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    color: Colors.white,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.softGray,
  },
});

export default ChatScreen;
