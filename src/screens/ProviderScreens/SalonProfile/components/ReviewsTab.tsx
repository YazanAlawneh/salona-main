import React from 'react';
import {FlatList} from 'react-native';
import styles from '../SalonProfile.styles';
import ReviewCard from '../../../../components/ReviewCard/ReviewCard';
import { useTranslation } from '../../../../contexts/TranslationContext';
interface Review {
  id: number;
  user_id: number;
  rate: number;
  message: string;
  created_at: string;
}

interface ReviewsTabProps {
  reviews: Review[];
}
const ReviewsTab: React.FC<ReviewsTabProps> = ({reviews}) => {
  const { isRTL } = useTranslation();

  const locale = isRTL ? 'ar-JO' : 'en-US';
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString || 'N/A';
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_) {
      return isoString || 'N/A';
    }
  };
  return (
    <FlatList
      data={reviews || []}
      keyExtractor={item => item.id.toString()}
      renderItem={({item}) => (
        <ReviewCard
          reviewerName={`User ${item.user_id}`}
          rating={item.rate}
          review={item.message}
          time={formatDate(item.created_at)}
        />
      )}
      contentContainerStyle={styles.reviewsList}
    />
  );
};

export default ReviewsTab; 