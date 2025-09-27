import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../contexts/TranslationContext';
import { useGuestMode } from '../../contexts/GuestModeContext';
import Colors from '../../constants/Colors';

interface GuestModeIndicatorProps {
  onExitGuestMode: () => void;
}

const GuestModeIndicator: React.FC<GuestModeIndicatorProps> = ({
  onExitGuestMode,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useTranslation();
  const { isGuestMode } = useGuestMode();

  if (!isGuestMode) {
    return null;
  }

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.content}>
        <Text style={[styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t.guestMode.guestModeDescription}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.exitButton}
        onPress={onExitGuestMode}
      >
        <Text style={styles.exitButtonText}>
          {t.guestMode.exitGuestMode}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  text: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  exitButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GuestModeIndicator;