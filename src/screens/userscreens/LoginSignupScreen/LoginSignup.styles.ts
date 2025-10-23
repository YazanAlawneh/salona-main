import {StyleSheet} from 'react-native';
import Colors from '../../../constants/Colors';
import {Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 80,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 30,
    alignItems: 'center',
  },
  loginButton: {
    width: '90%',
    borderRadius: 25,
  },
  signupButton: {
    borderRadius: 12,
    width: '90%',
  },
  background: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 2.4,
    marginBottom: 5,
  },
  description: {
    fontSize: 15,
    color: Colors.hardGray,
    letterSpacing: 1.2,
    lineHeight: 30,
    fontWeight: '500',
    marginBottom: 20,
  },
  signInTxtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    flexWrap: 'wrap', // In case text is long
  },
  signInTxt: {
    color: Colors.customBlack,
    fontSize: 16,
    lineHeight: 24,
  },
  loginTxtSapan: {
    color: Colors.gold,
    fontWeight: '600',
    fontSize: 16, // Match the parent font size for alignment
    lineHeight: 24, // Match the parent line height
  },

  signUpProviderWrapper: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 2,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden', // This ensures the border radius clips properly
  },
  signUpProviderTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    padding: 10,
  },
});

export default styles;
