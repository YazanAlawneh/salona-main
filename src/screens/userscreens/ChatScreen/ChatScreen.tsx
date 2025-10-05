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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import chatService from '../../../services/chatService';

interface Message {
  id: string;
  text: string;
  sender_id: number;
  receiver_id: number;
  time: string;
}

interface ChatScreenProps {
  route: {
    params: {
      user: {
        id: number;
        name: string;
        image_url: string;
      };
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({route, navigation}) => {
  const {user} = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!currentUser?.id || !user.id || !token) return;

    console.log('Setting up chat subscription:', {
      currentUserId: currentUser.id,
      userId: user.id,
    });

    // First get latest messages from Firebase
    const loadMessages = async () => {
      try {
        console.log('===== STARTING FIREBASE FETCH =====');
        console.log('Attempting to fetch messages from Firebase');
        const firebaseMessages = await chatService.getMessages(
          currentUser.id,
          user.id,
          false,
          token,
        );
        console.log('Firebase messages result:', firebaseMessages);

        // Convert Firebase messages to our format
        const formattedMessages = firebaseMessages.map((msg: any) => {
          console.log('Processing Firebase message:', msg);
          return {
            id: msg.id,
            text: msg.message,
            sender_id: parseInt(msg.sender_id),
            receiver_id: parseInt(msg.receiver_id),
            time: msg.time || msg.created_at,
          };
        });

        // Sort messages by time
        const sortedMessages = formattedMessages.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );

        setMessages(sortedMessages);
        console.log('===== FIREBASE FETCH COMPLETED =====');

        // After getting Firebase messages, fetch older messages from API
        console.log('Fetching older messages from API');
        try {
          console.log('===== STARTING API CALL =====');
          const apiUrl = `https://bella-glam.com/api/get-messages/${user.id}`;
          console.log('API URL:', apiUrl);
          console.log('API Headers:', {
            Authorization: `Bearer ${token.substring(0, 10)}...`,
          });

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('API Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('API Response Data:', JSON.stringify(data, null, 2));
          console.log('Received messages from API:', data.length);

          // Convert API messages to our format
          const apiMessages: Message[] = data.map((msg: any) => {
            console.log('Processing API message:', msg);
            return {
              id: msg.id,
              text: msg.message,
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id,
              time: msg.created_at,
            };
          });

          // Merge API messages with Firebase messages
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
                    m.text === msg.text,
                ),
            );
            // Sort all messages by time
            return uniqueMessages.sort(
              (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
            );
          });

          console.log('===== API CALL COMPLETED =====');
        } catch (error) {
          console.error('Error fetching older messages from API:', error);
        }
      } catch (error) {
        console.error('Error in loadMessages:', error);
      }
    };

    console.log('Calling loadMessages function');
    loadMessages();

    // Subscribe to real-time messages from Firebase
    const unsubscribe = chatService.subscribeToMessages(
      currentUser.id,
      user.id,
      firebaseMessages => {
        console.log(
          'Received messages update from Firebase:',
          firebaseMessages,
        );

        // Convert Firebase messages to our format
        const formattedMessages = firebaseMessages.map((msg: any) => {
          console.log('Processing real-time Firebase message:', msg);
          return {
            id: msg.id,
            text: msg.message,
            sender_id: parseInt(msg.sender_id),
            receiver_id: parseInt(msg.receiver_id),
            time: msg.time || msg.created_at,
          };
        });

        setMessages(
          formattedMessages.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          ),
        );
      },
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up chat subscription');
      unsubscribe();
    };
  }, [user.id, currentUser?.id, token]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser?.id || !token) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Send message through service
    const sent = await chatService.sendMessage(
      messageText,
      user.id,
      token,
      currentUser.id,
    );

    if (!sent) {
      // Show error message to user
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const renderMessage = ({item}: {item: Message}) => {
    // Check if the message is from the current user
    const isUserMessage = item.sender_id === currentUser?.id;
    console.log(
      'Message:',
      item.text,
      'Sender ID:',
      item.sender_id,
      'Current User ID:',
      currentUser?.id,
      'Is User Message:',
      isUserMessage,
    );

    return (
      <View
        style={[
          styles.messageContainer,
          isUserMessage ? styles.userMessage : styles.providerMessage,
        ]}>
        {!isUserMessage && (
          <Image source={{uri: user.image_url}} style={styles.providerAvatar} />
        )}
        <View
          style={[
            styles.messageBubble,
            isUserMessage ? styles.userBubble : styles.providerBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isUserMessage ? styles.userText : styles.providerText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTimestamp,
              isUserMessage ? styles.userTimestamp : styles.providerTimestamp,
            ]}>
            {new Date(item.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
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
        <View style={styles.userInfo}>
          <Image source={{uri: user.image_url}} style={styles.headerAvatar} />
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="more-vert" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.time}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton}>
          <Icon name="attach-file" size={24} color={Colors.white} />
        </TouchableOpacity>
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
            color={newMessage.trim() ? Colors.white : Colors.softGray}
          />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userStatus: {
    fontSize: 12,
    color: Colors.gold,
  },
  menuButton: {
    padding: 5,
  },
  messagesList: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  providerMessage: {
    alignSelf: 'flex-start',
  },
  providerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    padding: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  providerBubble: {
    backgroundColor: Colors.hardGray,
    borderRadius: 16,
    padding: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: Colors.black,
    fontSize: 14,
  },
  providerText: {
    color: Colors.white,
    fontSize: 14,
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    fontSize: 10,
    color: Colors.black,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  providerTimestamp: {
    fontSize: 10,
    color: Colors.softGray,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.black,
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
  },
  attachmentButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.hardGray,
    borderRadius: 20,
    color: Colors.white,
    maxHeight: 80,
    minHeight: 36,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
