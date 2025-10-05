import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NotificationCard from '../../../components/NotificationCard/NotificationCard';
import Colors from '../../../constants/Colors';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from '../../../contexts/TranslationContext';
import {notificationService} from '../../../services/notificationService';
import Footer from '../../../components/Footer/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './NotificationsScreen.styles';

interface Notification {
  id: number;
  user_id: number;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  data: string;
  is_read: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

interface NotificationsResponse {
  success: boolean;
  notifications: {
    current_page: number;
    data: Notification[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t, isRTL} = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(true);
  const [perPage, setPerPage] = useState<number>(10);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to fetch notifications
  const fetchNotifications = useCallback(
    async (page: number, shouldRefresh: boolean = false) => {
      try {
        setLoading(true);

        // Get the token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error(t.notifications.errors.noToken);
        }

        const apiUrl = `https://bella-glam.com/api/notifications?per_page=${perPage}&page=${page}`;
        // const apiUrl = `https://bella-glam.com/api/notifications?per_page=${perPage}&page=${page}`;

        // Fetch notifications from the API
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(t.notifications.errors.fetchFailed);
        }

        const data: NotificationsResponse = await response.json();

        if (data.success) {
          if (shouldRefresh) {
            setNotifications(data.notifications.data);
          } else {
            setNotifications(prev => [...prev, ...data.notifications.data]);
          }

          setCurrentPage(data.notifications.current_page);
          setHasMorePages(data.notifications.next_page_url !== null);
        } else {
          throw new Error(t.notifications.errors.apiError);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, t],
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialNotifications = async () => {
      if (isMounted) {
        await fetchNotifications(1, true);
      }
    };

    loadInitialNotifications();

    return () => {
      isMounted = false;
    };
  }, [fetchNotifications]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    console.log(
      '📥 Load more triggered - Current page:',
      currentPage,
      'Has more:',
      hasMorePages,
    );
    if (!loading && hasMorePages) {
      fetchNotifications(currentPage + 1);
    }
  }, [loading, hasMorePages, currentPage, fetchNotifications]);

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalVisible(true);
  };

  // Get notification icon based on title
  const getNotificationIcon = (title: string) => {
    if (title.toLowerCase().includes('booking')) {
      return 'event';
    } else if (title.toLowerCase().includes('message')) {
      return 'message';
    } else if (title.toLowerCase().includes('payment')) {
      return 'payment';
    } else if (title.toLowerCase().includes('cancel')) {
      return 'cancel';
    }
    return 'notifications';
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t.notifications.timeAgo.justNow;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t.notifications.timeAgo.minutes}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${t.notifications.timeAgo.hours}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${t.notifications.timeAgo.days}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${t.notifications.timeAgo.months}`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} ${t.notifications.timeAgo.years}`;
  };

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [] as Notification[],
      yesterday: [] as Notification[],
      older: [] as Notification[],
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      notificationDate.setHours(0, 0, 0, 0);

      if (notificationDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const renderItem = ({item}: {item: Notification}) => {
    const isArabic = isRTL; // Use isRTL from translation context
    const title = isArabic ? item.title_ar : item.title_en;
    const message = isArabic ? item.message_ar : item.message_en;

    return (
      <NotificationCard
        icon={getNotificationIcon(title)}
        category={title}
        message={message}
        time={formatTimeAgo(item.created_at)}
        isUnread={item.is_read === 0}
        data={item.data}
        onPress={() => handleNotificationPress(item)}
        title_ar={item.title_ar}
        title_en={item.title_en}
        message_ar={item.message_ar}
        message_en={item.message_en}
      />
    );
  };

  const renderFooter = () => {
    if (!loading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.gold} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="notifications-none" size={48} color="#CCCCCC" />
        <Text style={[styles.emptyText, {color: Colors.titleColor}]}>
          {t.notifications.noNotifications}
        </Text>
      </View>
    );
  };

  const renderSectionHeader = (title: string) => {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    );
  };

  const renderGroupedNotifications = () => {
    const groups = groupNotificationsByDate();

    return (
      <FlatList
        data={[
          {type: 'header', title: 'Today', data: groups.today},
          {type: 'header', title: 'Yesterday', data: groups.yesterday},
          {type: 'header', title: 'Older', data: groups.older},
        ]}
        keyExtractor={(item, index) => `section-${index}`}
        renderItem={({item}) => {
          if (item.type === 'header') {
            if (item.data.length === 0) return null;
            return renderSectionHeader(item.title);
          }
          return null;
        }}
        ListFooterComponent={
          <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.notificationsList,
              isRTL && styles.notificationsListRTL,
            ]}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={false}
          />
        }
        scrollEnabled={false}
      />
    );
  };

  const renderNotificationModal = () => {
    if (!selectedNotification) return null;

    const isArabic = isRTL;
    const title = isArabic
      ? selectedNotification.title_ar
      : selectedNotification.title_en;
    const message = isArabic
      ? selectedNotification.message_ar
      : selectedNotification.message_en;
    const parsedData = selectedNotification.data
      ? JSON.parse(selectedNotification.data)
      : null;
    const cancelReason = parsedData?.cancel_reason;

    return (
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}>
                <Icon name="close" size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{message}</Text>
              {cancelReason && (
                <View style={styles.cancelReasonContainer}>
                  <Text style={styles.cancelReasonText}>
                    {t.notifications.cancellationReason}: {cancelReason}
                  </Text>
                </View>
              )}
              <Text style={styles.modalTime}>
                {formatTimeAgo(selectedNotification.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  console.log(
    '🔄 Rendering NotificationsScreen - Notifications count:',
    notifications.length,
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View style={styles.container}>
        <View style={[styles.header, isRTL && styles.headerRTL]}>
          <Text style={styles.headerTitle}>{t.notifications.title}</Text>
          {/* {notifications.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearText}>{t.notifications.clearAll}</Text>
          <Icon name="clear-all" size={20} color={Colors.gold} />
        </TouchableOpacity>
      )} */}
        </View>

        {loading && notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={48} color={Colors.gold} />
            <Text style={styles.emptyText}>{t.notifications.empty}</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={[
              styles.notificationsList,
              isRTL && styles.notificationsListRTL,
            ]}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.gold]}
                tintColor={Colors.gold}
              />
            }
            ListFooterComponent={
              loading && notifications.length > 0 ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color={Colors.gold}
                />
              ) : null
            }
          />
        )}
      </View>
      <Footer />
      {renderNotificationModal()}
    </View>
  );
};

export default NotificationsScreen;
