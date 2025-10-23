import {StyleSheet} from 'react-native';
import Colors from '../../../constants/Colors';
import {withDecay} from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    // paddingTop: 20, // Reduced top padding for better spacing
    // backgroundColor: Colors.black,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.gold,
    fontFamily: 'Maitree-Regular',
    marginBottom: 4,
    opacity: 0.9,
    alignSelf: 'flex-start',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Maitree-Bold',
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: 'rgba(255, 217, 0, 0.25)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 0, 0.82)',
  },
  notificationIcon: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    // backgroundColor: Colors.black,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Maitree-Medium',
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.black,
    fontWeight: '600',
    fontFamily: 'Maitree-Medium',
  },
  content: {
    flex: 1,
    padding: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 30,
    fontFamily: 'Maitree-Bold',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    color: Colors.white,
    flex: 1,
    fontFamily: 'Maitree-Regular',
  },
  language: {
    color: Colors.softGray,
    marginLeft: 'auto',
    fontFamily: 'Maitree-Regular',
  },
  AddServiceButton: {
    backgroundColor: Colors.gold,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  AddServiceButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Maitree-Medium',
  },
  portfolioContainer: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8, // Add small horizontal padding for breathing room
  },
  portfolioContainerRTL: {
    direction: 'rtl',
  },
  portfolioList: {
    paddingBottom: 16,
    paddingHorizontal: 0, // Ensure no horizontal padding
  },
  portfolioListRTL: {
    direction: 'rtl',
  },
  portfolioItem: {
    margin: 1, // Match the inline margin for consistency
    borderRadius: 0, // Remove border radius for full coverage
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioItemRTL: {
    direction: 'rtl',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.black,
    padding: 8,
    borderRadius: 20,
  },
  deleteButtonRTL: {
    right: 8,
    left: undefined,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Colors.black,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButtonRTL: {
    flexDirection: 'row-reverse',
  },
  uploadText: {
    color: Colors.gold,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Maitree-Medium',
  },
  uploadTextRTL: {
    marginLeft: 0,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainerRTL: {
    direction: 'rtl',
  },
  emptyText: {
    color: Colors.hardGray,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Maitree-Regular',
  },
  emptyTextRTL: {
    direction: 'rtl',
  },
  fullWidthImage: {
    flex: 1,
  },
  image: {
    width: '100%',
  },
  reviewsList: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  servicesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  continueButton: {
    backgroundColor: Colors.gold,
    width: '50%',
    alignSelf: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  continueButtonText: {
    color: Colors.black,
    fontSize: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editButton: {
    padding: 5,
    marginRight: 10,
    marginLeft: 10,
  },
  editButtonRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  blockTimeButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  blockTimeButtonRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  blockTimeButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontFamily: 'Maitree-Medium',
  },
  // About Tab Styles
  aboutContainer: {
    paddingTop: 20,
    padding: 0,
    flex: 1,
    width: '100%',
  },
  sectionContainer: {
    // marginBottom: 24,
    paddingHorizontal: 20,
    width: '100%',
  },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    justifyContent: 'space-evenly',
  },
  label: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '900',
    flex: 0.5,
    textAlign: 'right',
  },
  value: {
    fontSize: 16,
    color: Colors.white,
    // flex: 0.7,
    textAlign: 'left',
  },
  description: {
    fontSize: 14,
    color: Colors.white,
    marginVertical: 16,
    lineHeight: 20,
    width: '100%',
    fontFamily: 'Maitree-Regular',
  },
  readMore: {
    color: Colors.gold,
  },
  addressContainer: {
    marginTop: 8,
  },
  addressText: {
    marginLeft: 10,
    color: Colors.white,
  },
  button: {
    backgroundColor: Colors.black,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
    width: '100%',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    // fontWeight: 'bold',
  },
  // RTL support
  rowRTL: {
    // flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    justifyContent: 'space-evenly',
  },
  labelRTL: {
    textAlign: 'right',
    // flex: 1,
  },
  valueRTL: {
    // textAlign: 'right',
    marginHorizontal: 10,
  },
  timeContainerRTL: {
    flexDirection: 'row',

    alignItems: 'center',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.black,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Maitree-Bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Maitree-Regular',
  },
  currentFeeText: {
    color: Colors.white,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Maitree-Regular',
  },
  input: {
    backgroundColor: Colors.softGray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Regular',
  },
  updateButton: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Maitree-Bold',
  },
  // Image Viewer Styles
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  viewerDeleteButton: {
    backgroundColor: 'rgba(251, 59, 59, 0.61)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseButton: {
    // backgroundColor: Colors.goldTransparent20,
    backgroundColor: 'rgba(175, 175, 175, 0.8)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;
