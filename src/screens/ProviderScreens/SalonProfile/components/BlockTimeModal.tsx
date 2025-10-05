import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from '../../../../contexts/TranslationContext';
import {format, addDays} from 'date-fns';
import {arSA} from 'date-fns/locale';
import {useGetAvailabilityQuery} from '../../../../redux/api/salonApi';
import {useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootState} from '../../../../redux/store';
interface BlockTimeModalProps {
  visible: boolean;
  onClose: () => void;
  dayId: number;
  currentOpeningTime: string;
  currentClosingTime: string;
  salonId: number;
  onSuccess: () => void;
}

// Helper to convert '4:00 PM' to '16:00'
function to24Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

const BlockTimeModal: React.FC<BlockTimeModalProps> = ({
  visible,
  onClose,
  dayId,
  currentOpeningTime,
  currentClosingTime,
  salonId,
  onSuccess,
}) => {
  const {t, isRTL} = useTranslation();
  const {user, token} = useSelector((state: RootState) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate next 7 days for date picker
  const dates = Array.from({length: 7}, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      day: format(date, 'dd', {locale: isRTL ? arSA : undefined}),
      label: format(date, 'EEEE', {locale: isRTL ? arSA : undefined}),
    };
  });

  // Fetch time slots for the selected date using the API
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: availabilityData,
    isLoading,
    error,
    refetch: refetchAvailability,
  } = useGetAvailabilityQuery(
    {
      salonId,
      date: formattedDate,
    },
    {
      skip: !salonId,
    },
  );
  console.log('[BlockTimeModal] Availability API response:', availabilityData);

  // Use periods from API response, map all valid slot strings
  const timeSlots = (availabilityData?.periods || [])
    .map(slot => (typeof slot.start === 'string' ? slot.start : ''))
    .filter(slot => slot.length > 0);

  // Handle time slot selection for start only
  const handleTimeSlotPress = (slot: string) => {
    setSelectedStart(slot);
    // Find the next slot (1 hour after start)
    const [startHour, startMinute] = slot.split(':').map(Number);
    let endHour = startHour + 1;
    let endMinute = startMinute;
    if (endHour > 23) endHour = 23;
    const endSlot = `${endHour.toString().padStart(2, '0')}:${endMinute
      .toString()
      .padStart(2, '0')}`;
    // If the next slot exists in timeSlots, use it; otherwise, just add 1 hour
    setSelectedEnd(timeSlots.includes(endSlot) ? endSlot : endSlot);
  };

  // Prepare API call
  const handleSave = async () => {
    if (!selectedStart) return;
    setIsSubmitting(true);
    try {
      // Find the next slot after selectedStart for end_time
      const startIdx = timeSlots.indexOf(selectedStart);
      let endTime = '';
      if (startIdx !== -1 && startIdx + 1 < timeSlots.length) {
        endTime = timeSlots[startIdx + 1];
      } else {
        // Fallback: add 1 hour in AM/PM format
        const [time, period] = selectedStart.split(' ');
        let [hour, minute] = time.split(':').map(Number);
        hour += 1;
        if (hour > 12) {
          hour = 1;
          // Optionally toggle AM/PM if needed
        }
        endTime = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
      }
      const payload = {
        salon_id: salonId,
        date: formattedDate,
        start_time: to24Hour(selectedStart),
        end_time: to24Hour(endTime),
      };
      // API call
      const response = await fetch(
        'https://bella-glam.com/api/salons/block-time-period',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      console.log('[BlockTimeModal] Block time API response:', {
        status: response.status,
        ok: response.ok,
        body: result,
      });
      if (!response.ok) {
        throw new Error(result.message || 'Failed to block time period');
      }
      onSuccess();
      refetchAvailability();
      onClose();
    } catch (error) {
      console.error('Error saving blocked time slots:', error);
      // Optionally show an alert or error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>
              {t.salonProfile.blockTime.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          <View style={styles.dateContainer}>
            <FlatList
              data={dates}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.date.toISOString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    selectedDate.getDate() === item.date.getDate() &&
                      styles.selectedDateButton,
                  ]}
                  onPress={() => setSelectedDate(item.date)}>
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate.getDate() === item.date.getDate() &&
                        styles.selectedDateText,
                    ]}>
                    {item.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayText,
                      selectedDate.getDate() === item.date.getDate() &&
                        styles.selectedDateText,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Time Slot Picker */}
          <ScrollView style={styles.slotsContainer}>
            <Text style={styles.slotTitle}>
              {t.salonProfile.blockTime.selectSlots}
            </Text>
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={Colors.gold}
                style={{marginVertical: 20}}
              />
            ) : timeSlots.length === 0 ? (
              <Text
                style={{
                  color: Colors.softGray,
                  textAlign: 'center',
                  marginVertical: 20,
                }}>
                {t.salonProfile.blockTime.noAvailableTimeSlots}
              </Text>
            ) : (
              <View style={styles.slotButtonsContainer}>
                {timeSlots.map(slot => {
                  const isSelected =
                    selectedStart === slot || selectedEnd === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotButton,
                        isSelected && styles.selectedSlotButton,
                      ]}
                      onPress={() => handleTimeSlotPress(slot)}>
                      <Text
                        style={[
                          styles.slotText,
                          isSelected && styles.selectedSlotText,
                        ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>
                {t.salonProfile.blockTime.cancel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!selectedStart || isSubmitting) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!selectedStart || isSubmitting}>
              <Text style={styles.saveButtonText}>
                {t.salonProfile.blockTime.save}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.black,
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Maitree-Bold',
    color: Colors.gold,
  },
  closeButton: {
    padding: 5,
  },
  dateContainer: {
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: Colors.hardGray,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 50,
  },
  selectedDateButton: {
    backgroundColor: Colors.gold,
  },
  dateText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
  },
  dayText: {
    color: Colors.softGray,
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
  },
  selectedDateText: {
    color: Colors.black,
  },
  slotsContainer: {
    maxHeight: '50%',
  },
  slotTitle: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
    marginBottom: 15,
  },
  slotButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    backgroundColor: Colors.hardGray,
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 8,
  },
  selectedSlotButton: {
    backgroundColor: Colors.gold,
  },
  slotText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
  },
  selectedSlotText: {
    color: Colors.black,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.hardGray,
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.gold,
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'Maitree-Regular',
  },
  saveButtonText: {
    color: Colors.black,
    textAlign: 'center',
    fontFamily: 'Maitree-Bold',
  },
});

export default BlockTimeModal;
