import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {useTranslation} from '../../contexts/TranslationContext';
import {useGuestMode} from '../../contexts/GuestModeContext';
import Colors from '../../constants/Colors';

interface GuestRestrictedModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
}

const GuestRestrictedModal: React.FC<GuestRestrictedModalProps> = ({
  visible,
  onClose,
  onLogin,
  onSignup,
}) => {
  const {t} = useTranslation();
  const {isRTL} = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.content}>
            <Text style={[styles.title, {textAlign: isRTL ? 'right' : 'left'}]}>
              {t.guestMode.loginRequired}
            </Text>
            <Text
              style={[styles.message, {textAlign: isRTL ? 'right' : 'left'}]}>
              {t.guestMode.loginRequiredMessage}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={onLogin}>
                <Text style={styles.loginButtonText}>{t.guestMode.login}</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={[styles.button, styles.signupButton]}
                onPress={onSignup}>
                <Text style={styles.signupButtonText}>
                  {t.guestMode.signup}
                </Text>
              </TouchableOpacity> */}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text
                style={[
                  styles.cancelButtonText,
                  {textAlign: isRTL ? 'right' : 'left'},
                ]}>
                {t.common.cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.gold,
  },
  signupButton: {
    backgroundColor: '#000000',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: Colors.hardGray,
    fontSize: 16,
  },
});

export default GuestRestrictedModal;
