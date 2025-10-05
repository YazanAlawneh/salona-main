import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NotificationCard from '../../../components/NotificationCard/NotificationCard';
import styles from './Notifications.styles';
import {useNavigation} from '@react-navigation/native';
import ProviderFooter from '../../../components/ProviderFooter/ProviderFooter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from '../../../contexts/TranslationContext';
import {Notification, NotificationsResponse} from './types';
import Colors from '../../../constants/Colors';
import {SafeAreaView} from 'react-native-safe-area-context';

const ProviderNotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {t} = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMorePages, setHasMorePages] = useState<boolean>(true);
  const [perPage, setPerPage] = useState<number>(10);

  // Function to fetch notifications
  const fetchNotifications = useCallback(
    async (page: number = 1, refresh: boolean = false) => {
      try {
        console.log(
          '🔍 Fetching provider notifications - Page:',
          page,
          'Refresh:',
          refresh,
        );

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        // Get the token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        console.log('🔑 Token available:', !!token);
        console.log('🔑 Token value:', token); // Log token value for debugging

        if (!token) {
          throw new Error('No authentication token found');
        }

        // Using the correct API endpoint
        const apiUrl = `https://bella-glam.com/api/notifications?per_page=${perPage}&page=${page}`;
        console.log('🌐 API URL:', apiUrl);

        // Log request details
        console.log('📤 Request Headers:', {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        });

        // Fetch notifications from the API
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 API Response Status:', response.status);
        console.log('📡 API Response Status Text:', response.statusText);

        // Log response headers
        const headers: Record<string, string> = {};
        response.headers.forEach((value: string, key: string) => {
          headers[key] = value;
        });
        console.log('📥 Response Headers:', headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error Response Body:', errorText);
          throw new Error(
            `Failed to fetch notifications: ${response.status}\nResponse: ${errorText}`,
          );
        }

        const responseText = await response.text();
        console.log('📦 Raw API Response:', responseText);

        let data: NotificationsResponse;
        try {
          data = JSON.parse(responseText);
          console.log('✅ Parsed API Response:', JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError);
          throw new Error(
            `Invalid JSON response from server: ${
              parseError instanceof Error ? parseError.message : 'Unknown error'
            }\nResponse: ${responseText}`,
          );
        }

        if (data.success) {
          console.log('📊 Notifications Data:', {
            count: data.notifications.data.length,
            currentPage: data.notifications.current_page,
            totalPages: data.notifications.last_page,
            totalItems: data.notifications.total,
            hasMore: data.notifications.next_page_url !== null,
          });

          if (refresh) {
            setNotifications(data.notifications.data);
          } else {
            setNotifications(prev => [...prev, ...data.notifications.data]);
          }

          setCurrentPage(data.notifications.current_page);
          setHasMorePages(data.notifications.next_page_url !== null);
        } else {
          console.error('❌ API returned success: false');
          throw new Error(
            'Failed to fetch notifications: API returned success: false',
          );
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        console.log(
          '🏁 Fetch completed - Loading:',
          loading,
          'Refreshing:',
          refreshing,
        );
      }
    },
    [perPage],
  );

  // Initial fetch
  useEffect(() => {
    console.log('🔄 Initial fetch triggered');
    fetchNotifications(1);
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

  // Get notification icon based on title
  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('appointment') || lowerTitle.includes('موعد')) {
      return 'event'; // Calendar icon for appointments
    } else if (lowerTitle.includes('product') || lowerTitle.includes('منتج')) {
      return 'inventory'; // Inventory icon for products
    } else if (lowerTitle.includes('offer') || lowerTitle.includes('عرض')) {
      return 'local-offer'; // Offer icon for offers
    } else {
      return 'notifications'; // Default notification icon
    }
  };

  // Format time ago with translations
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return t.notifications.timeAgo.justNow;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return t.notifications.timeAgo.minutes.replace(
        '{count}',
        minutes.toString(),
      );
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return t.notifications.timeAgo.hours.replace('{count}', hours.toString());
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return t.notifications.timeAgo.days.replace('{count}', days.toString());
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return t.notifications.timeAgo.months.replace(
        '{count}',
        months.toString(),
      );
    }

    const years = Math.floor(months / 12);
    return t.notifications.timeAgo.years.replace('{count}', years.toString());
  };

  const renderItem = ({item}: {item: Notification}) => {
    return (
      <NotificationCard
        icon={getNotificationIcon(item.title_en)}
        category={item.title_en}
        message={item.message_en}
        time={formatTimeAgo(item.created_at)}
        isUnread={item.is_read === 0}
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
        <ActivityIndicator size="small" color="#FF69B4" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="notifications-none" size={48} color="#666666" />
        <Text style={styles.emptyText}>{t.notifications.noNotifications}</Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#FF69B4" />
        <Text style={styles.errorText}>{t.notifications.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <ImageBackground
          source={require('../../../assets/images/pink-bg.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.notifications.title}</Text>
          <View style={{width: 24}} />
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => `notification-${item.id}-${item.created_at}`}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FF69B4']}
              tintColor="#FF69B4"
              progressBackgroundColor="#1E1E1E"
            />
          }
        />

        <ProviderFooter />
      </SafeAreaView>
    </View>
  );
};

export default ProviderNotificationsScreen;
