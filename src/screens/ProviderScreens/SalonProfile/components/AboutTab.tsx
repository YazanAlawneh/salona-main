import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import styles from '../SalonProfile.styles';
import {Salon} from '../../../../types/salon';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../../constants/Colors';
import EditAvailabilityModal from './EditAvailabilityModal';
import BlockTimeModal from './BlockTimeModal';
import CategoriesModal from './CategoriesModal';
import {useTranslation} from '../../../../contexts/TranslationContext';
import {useSelector} from 'react-redux';
import {RootState} from '../../../../redux/store';

interface AboutTabProps {
  salon: Salon[];
  salonId: number;
  onAvailabilityUpdate: () => void;
}

const AboutTab: React.FC<AboutTabProps> = ({
  salon,
  salonId,
  onAvailabilityUpdate,
}) => {
  const {t, isRTL} = useTranslation();
  const {token} = useSelector((state: RootState) => state.auth);

  const [selectedDay, setSelectedDay] = useState<{
    id: number;
    openingTime: string;
    closingTime: string;
    day: string;
  } | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isBlockTimeModalVisible, setIsBlockTimeModalVisible] = useState(false);
  const [isCategoriesModalVisible, setIsCategoriesModalVisible] =
    useState(false);
  const [showTravelFeesModal, setShowTravelFeesModal] = useState(false);
  const [travelFees, setTravelFees] = useState<string>('');
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Sort availabilities to start from Sunday
  const sortedAvailabilities = useMemo(() => {
    if (!salon?.availabilities) return [];

    const dayOrder = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    return [...salon.availabilities].sort((a, b) => {
      const aIndex = dayOrder.indexOf(a.day.toLowerCase());
      const bIndex = dayOrder.indexOf(b.day.toLowerCase());
      return aIndex - bIndex;
    });
  }, [salon?.availabilities]);

  const handleEditPress = (availability: any) => {
    setSelectedDay({
      id: availability.id,
      openingTime: availability.opening_time,
      closingTime: availability.closing_time,
      day: availability.day,
    });
    setIsEditModalVisible(true);
  };

  const handleBlockTimePress = (availability: any) => {
    setSelectedDay({
      id: availability.id,
      openingTime: availability.opening_time,
      closingTime: availability.closing_time,
      day: availability.day,
    });
    setIsBlockTimeModalVisible(true);
  };

  const handleChooseCategories = () => {
    setIsCategoriesModalVisible(true);
  };

  const handleSaveCategories = (selectedCategoryIds: number[]) => {
    setIsCategoriesModalVisible(false);
  };

  const translateDay = (day: string) => {
    const dayKey = day.toLowerCase() as keyof typeof t.salonProfile.about.days;
    return t.salonProfile.about.days[dayKey];
  };

  // Travel Fees Functions
  const fetchCurrentTravelFees = async () => {
    try {
      setIsLoadingFees(true);
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch('https://bella-glam.com/api/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      if (data.message === 'user data return successfully' && data.data) {
        setTravelFees(data.data.service_fee || '0');
      }
    } catch (error) {
      console.error('Error fetching travel fees:', error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  const handleTravelFeesUpdate = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('service_fee', travelFees);

      const response = await fetch(
        'https://bella-glam.com/api/update-service-fee',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update travel fees: ${response.status}`);
      }

      const data = await response.json();
      if (data.message === 'User updated successfully') {
        Alert.alert('Success', t.salonProfile.about.travelFeesUpdated);
        setShowTravelFeesModal(false);
        setTravelFees('');
      } else {
        throw new Error(data.message || 'Failed to update travel fees');
      }
    } catch (error) {
      console.error('Error updating travel fees:', error);
      Alert.alert('Error', 'Failed to update travel fees');
    }
  };

  const openTravelFeesModal = () => {
    fetchCurrentTravelFees();
    setShowTravelFeesModal(true);
  };

  useEffect(() => {
    console.log('Salon Addressssss:', salon.about);
  }, [salon]);

  return (
    <ScrollView
      style={[styles.aboutContainer, isRTL && {direction: 'rtl'}]}
      showsVerticalScrollIndicator={false}>
      {/* Opening Times Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>
          {t.salonProfile.about.openingTimes}
        </Text>

        {sortedAvailabilities.map(availability => (
          <View
            key={availability.id}
            style={[styles.row, isRTL && styles.rowRTL]}>
            <Text
              style={[
                styles.label,
                isRTL && styles.labelRTL,
                {textTransform: 'capitalize'},
              ]}>
              {translateDay(availability.day)}
            </Text>
            <View
              style={[styles.timeContainer, isRTL && styles.timeContainerRTL]}>
              <TouchableOpacity
                style={[styles.editButton, isRTL && styles.editButtonRTL]}
                onPress={() => handleEditPress(availability)}>
                <Icon name="edit" size={24} color={Colors.gold} />
              </TouchableOpacity>
              <Text style={[styles.value, isRTL && styles.valueRTL]}>
                {formatTime(availability.opening_time)} -{' '}
                {formatTime(availability.closing_time)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Forbidden Times Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {marginBottom: 10, marginTop: 10, backgroundColor: Colors.gold},
          ]}
          onPress={() => setIsBlockTimeModalVisible(true)}>
          <Text style={[styles.buttonText, {color: Colors.black}]}>
            {t.salonProfile.blockTime.title}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Travel Fees Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              marginBottom: 20,
              backgroundColor: Colors.black,
              borderColor: Colors.gold,
            },
          ]}
          onPress={openTravelFeesModal}>
          <Text style={[styles.buttonText, {color: Colors.gold}]}>
            {t.salonProfile.about.travelFees}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Travel Fees Modal */}
      <Modal
        visible={showTravelFeesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTravelFeesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View
              style={
                styles.modalHeader && isRTL
                  ? styles.modalHeaderRTL
                  : styles.modalHeader
              }>
              <Text style={styles.modalTitle}>
                {t.salonProfile.about.updateTravelFees}
              </Text>
              <TouchableOpacity onPress={() => setShowTravelFeesModal(false)}>
                <Icon name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            {isLoadingFees ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.gold} size="small" />
                <Text style={styles.loadingText}>
                  {t.salonProfile.about.pleaseWait}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.currentFeeText}>
                  {t.salonProfile.about.currentTravelFees}: {travelFees || '0'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={travelFees}
                  onChangeText={setTravelFees}
                  placeholder={t.salonProfile.about.enterTravelFees}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.softGray}
                />
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleTravelFeesUpdate}>
                  <Text style={styles.updateButtonText}>
                    {t.salonProfile.about.update}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <EditAvailabilityModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        dayId={selectedDay?.id || 0}
        currentOpeningTime={selectedDay?.openingTime || ''}
        currentClosingTime={selectedDay?.closingTime || ''}
        salonId={salonId}
        onSuccess={onAvailabilityUpdate}
      />

      <BlockTimeModal
        visible={isBlockTimeModalVisible}
        onClose={() => setIsBlockTimeModalVisible(false)}
        dayId={selectedDay?.id || 0}
        currentOpeningTime={selectedDay?.openingTime || ''}
        currentClosingTime={selectedDay?.closingTime || ''}
        salonId={salonId}
        onSuccess={onAvailabilityUpdate}
      />

      <CategoriesModal
        visible={isCategoriesModalVisible}
        onClose={() => setIsCategoriesModalVisible(false)}
        onSave={handleSaveCategories}
        initialSelectedCategories={salon?.categories?.map(cat => cat.id) || []}
      />
    </ScrollView>
  );
};

export default AboutTab;
