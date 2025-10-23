import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Share,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import ProfileHeader from '../../../components/ProfileHeader/ProfileHeader';
import {useNavigation, useRoute} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import styles from './SalonProfile.styles';
import ReviewCard from '../../../components/ReviewCard/ReviewCard';
import Footer from '../../../components/Footer/Footer';
import ServiceCard from '../../../components/ServiceCard/ServiceCard';
import PackageCard from '../../../screens/ProviderScreens/SalonProfile/components/PackageCard/PackageCard';
import Colors from '../../../constants/Colors';
import DateSelectionModal from '../../../components/BookingCalendar/DateSelectionModal';
import {
  useGetSalonByIdQuery,
  useToggleFavoriteSalonMutation,
} from '../../../redux/api/salonApi';
import {useTranslation} from '../../../contexts/TranslationContext';
import {useGuestMode} from '../../../contexts/GuestModeContext';
import {useGetUserAddressesQuery} from '../../../redux/api/addressApi';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import PortfolioGrid from './components/PortfolioGrid ';
import PackagesList from './components/Packages';
import ReviewConfirmModal from './components/ReviewConfirmModal';
import GuestRestrictedModal from '../../../components/GuestRestrictedModal/GuestRestrictedModal';
import DebugPanel from '../../../components/DebugPanel/DebugPanel';

type SalonProfileRouteProp = RouteProp<
  {
    params: {
      salon: {
        image: string;
        name: string;
        id: number;
      };
      initialTab?: string;
    };
  },
  'params'
>;

interface Package {
  id: number;
  name: string;
  description: string;
  amount: string;
  time: string;
  services: string;
  salon_id: number;
  created_at: string;
  updated_at: string;
}

const SalonProfileScreen = () => {
  const route = useRoute<SalonProfileRouteProp>();
  const navigation = useNavigation();
  const {salon, initialTab} = route.params;
  const [activeTab, setActiveTab] = useState(initialTab || 'About');
  const [selectedServices, setSelectedServices] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedPackages, setSelectedPackages] = useState<{
    [key: string]: boolean;
  }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const {t, isRTL} = useTranslation();
  const {isGuestMode, exitToLogin, exitToSignup} = useGuestMode();
  const [isFavorite, setIsFavorite] = useState(false);
  const [guestRestrictedModalVisible, setGuestRestrictedModalVisible] =
    useState(false);
  const [salonAddress, setSalonAddress] = useState<string>('');
  const {data: addressData} = useGetUserAddressesQuery();
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [portfolioImage, setPortfolioImage] = useState<string | null>(null);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);

  const {data: salonData, isLoading} = useGetSalonByIdQuery(salon.id);
  const [toggleFavorite] = useToggleFavoriteSalonMutation();

  const selectedAddress = useSelector(
    (state: RootState) => state.salons.selectedAddress,
  );

  console.log('Selected address from Redux:', selectedAddress);

  console.log('Salon from route params:', salon);
  console.log('Salon data from API:', salonData);

  // Function to check if salon is favorite
  const checkIsSalonFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `https://bella-glam.com/api/is-salon-favourite/${salon.id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      console.log('Is salon favorite response:', data);

      if (data.success) {
        setIsFavorite(data.is_favourite);
      }
    } catch (error) {
      console.error('Error checking salon favorite status:', error);
    }
  };

  useEffect(() => {
    // Check if salon is favorite when component mounts
    checkIsSalonFavorite();
    console.log('salonData', salonData);

    // Other existing useEffect code...
  }, [salon.id]);

  const handleContinue = () => {
    if (isGuestMode) {
      setGuestRestrictedModalVisible(true);
      return;
    }
    setModalVisible(false);
    setDateModalVisible(true);
  };

  const handleGuestModalLogin = () => {
    setGuestRestrictedModalVisible(false);
    // Exit guest mode and go to login screen
    exitToLogin();
  };

  const handleGuestModalSignup = () => {
    setGuestRestrictedModalVisible(false);
    // Exit guest mode and go to signup screen
    exitToSignup();
  };

  const toggleService = (id: string, service: any) => {
    setSelectedServices(prevState => {
      if (prevState[id]) {
        const updatedState = {...prevState};
        delete updatedState[id];
        return updatedState;
      }

      return {...prevState, [id]: service};
    });
  };

  const togglePackage = (id: string, packageItem: any) => {
    setSelectedPackages(prevState => {
      if (prevState[id]) {
        const updatedState = {...prevState};
        delete updatedState[id];
        return updatedState;
      }
      return {...prevState, [id]: packageItem};
    });
  };

  const calculateTotal = () => {
    const serviceFees = Number(salonData?.salons?.service_fee) || 0;
    const totalPrice = Object.values(selectedServices).reduce(
      (sum, service: any) => sum + service.price,
      0,
    );
    console.log('serviceFees', serviceFees);

    console.log('calculating total', totalPrice);

    return {serviceFees, totalPrice: totalPrice + serviceFees};
  };

  const calculateTotalDuration = () => {
    return Object.values(selectedServices).reduce((total, service: any) => {
      // Convert duration string to minutes (e.g., "35 Mins" -> 35)
      const duration = parseInt(service.duration.split(' ')[0]);
      return total + duration;
    }, 0);
  };

  const formatTime = (time: string) => {
    // Convert "10:00:00" to "10:00 AM" or "2:00 PM"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Update packages data to use API response
  const packages = salonData?.salons?.packages || [];

  const handleFavoritePress = async () => {
    try {
      await toggleFavorite({salon_id: salon.id}).unwrap();
      // Toggle the favorite status locally
      setIsFavorite(!isFavorite);
      console.log('Favorite toggled:', !isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBookingSuccess = () => {
    setSelectedServices({});
    setReviewModalVisible(false);
    // setModalVisible(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'About':
        return (
          <View style={styles.aboutContainer}>
            <View style={[styles.row, !isRTL && styles.rowRTL]}>
              <Text style={styles.label}>
                {t.salonProfile.about.shopName}:{' '}
              </Text>
              <Text style={styles.value}>
                {salonData?.salons?.name || salon.name}
              </Text>
            </View>
            <View style={[styles.row, !isRTL && styles.rowRTL]}>
              <Text style={styles.label}>
                {t.salonProfile.about.description}:{' '}
              </Text>
              <Text style={styles.description}>
                {salonData?.salons?.about || t.salonProfile.about.noDescription}
              </Text>
            </View>
            {salonData?.salons?.availabilities?.map(availability => (
              <View
                key={availability.id}
                style={[styles.row, !isRTL && styles.rowRTL]}>
                <Text style={[styles.label, {textTransform: 'capitalize'}]}>
                  {t.salonProfile.about.days[
                    availability.day.toLowerCase() as keyof typeof t.salonProfile.about.days
                  ] || availability.day}
                  :{' '}
                </Text>
                <Text style={styles.value}>
                  {formatTime(availability.opening_time)} -{' '}
                  {formatTime(availability.closing_time)}
                </Text>
              </View>
            ))}
            <View style={[styles.row, !isRTL && styles.rowRTL]}>
              <Text style={[styles.icon, !isRTL && styles.iconRTL]}>
                📍{' '}
                {salonData?.salons.addresses[0]?.description ||
                  t.salonProfile.about.noAddress}
              </Text>
            </View>
          </View>
        );
      case 'Services':
        return renderServices();
      case 'Portfolio':
        return <PortfolioGrid data={salonData} tr={t} />;

      case 'Reviews':
        const reviews = salonData?.salons?.ratings_received || [];
        console.log('Reviews Data:', reviews);

        if (!reviews || reviews.length === 0) {
          return (
            <View style={modalStyles.emptyContainer}>
              <Text style={modalStyles.emptyText}>
                {t.salonProfile.reviews.noReviews}
              </Text>
            </View>
          );
        }

        return (
          <FlatList
            data={reviews}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <ReviewCard
                reviewerName={item.user?.name || 'Anonymous'}
                rating={item.rate}
                review={item.message || 'No review message provided'}
                time={
                  item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : 'Recently'
                }
              />
            )}
            contentContainerStyle={styles.reviewsList}
          />
        );
      default:
        return null;
    }
  };

  const renderServices = () => {
    if (!salonData?.salons?.services?.length) {
      return (
        <View style={modalStyles.noServicesContainer}>
          <Text style={modalStyles.noServicesText}>
            {t.salonProfile.services.noServices}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesContainer}>
        {salonData?.salons?.services?.map(service => (
          <ServiceCard
            key={service.id}
            service={{
              id: service.id.toString(),
              name: service.service,
              duration: service.time,
              description: service.description || 'N/A',
              price: parseFloat(service.price),
            }}
            isSelected={!!selectedServices[service.id.toString()]}
            onAdd={() =>
              toggleService(service.id.toString(), {
                id: service.id.toString(),
                name: service.service,
                duration: service.time,
                price: parseFloat(service.price),
              })
            }
            onDelete={() =>
              toggleService(service.id.toString(), {
                id: service.id.toString(),
                name: service.service,
                duration: service.time,
                price: parseFloat(service.price),
              })
            }
          />
        ))}
      </View>
    );
  };

  const renderPackages = () => {
    return (
      <View style={styles.servicesContainer}>
        {packages.map((packageItem: Package) => (
          <PackageCard
            key={packageItem.id}
            packageName={packageItem.name}
            description={packageItem.description || 'N/A'}
            duration={`${packageItem.time} ${t.salonProfile.packages.packageDetails.duration}`}
            price={parseFloat(packageItem.amount)}
            isSelected={!!selectedPackages[packageItem.id.toString()]}
            onAddPress={() =>
              togglePackage(packageItem.id.toString(), packageItem)
            }
            onEditPress={() => console.log('Edit pressed')}
            onDeletePress={() => console.log('Delete pressed')}
            isRTL={isRTL}
            translations={{
              name: t.salonProfile.packages.packageDetails.name,
              description: t.salonProfile.packages.packageDetails.description,
              duration: t.salonProfile.packages.packageDetails.duration,
              price: t.salonProfile.packages.packageDetails.price,
              add: t.salonProfile.packages.actions.add,
              remove: t.salonProfile.packages.actions.remove,
              edit: t.salonProfile.packages.actions.edit,
              delete: t.salonProfile.packages.actions.delete,
              priceUnit: t.salonProfile.packages.priceUnit,
            }}
          />
        ))}
        {Object.values(selectedPackages).length > 0 && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              if (isGuestMode) {
                setGuestRestrictedModalVisible(true);
                return;
              }
              setModalVisible(true);
            }}>
            <Text style={styles.continueButtonText}>
              {t.salonProfile.packages.actions.continue}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderModal = () => {
    const {serviceFees, totalPrice} = calculateTotal();
    console.log('serviceFees 2 2 ', serviceFees);
    console.log('totalPrice 2 2', totalPrice);

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={modalStyles.modalContainer}>
          {/*
          < Close button for added services modal */}
          <View
            style={[
              modalStyles.closeButton,
              !isRTL && modalStyles.closeButtonNotRTL,
            ]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Text style={modalStyles.modalTitle}>
              {t.salonProfile.services.added}
            </Text>
          </View>

          <FlatList
            data={Object.values(selectedServices)}
            keyExtractor={(item: any) => item.id}
            renderItem={({item}: any) => (
              <View style={modalStyles.serviceItem}>
                <View>
                  <Text style={modalStyles.serviceName}>{item.name}</Text>
                  <Text style={modalStyles.serviceDuration}>
                    {item.duration} {t.salonProfile.services.mins}
                  </Text>
                </View>
                <Text
                  style={
                    modalStyles.servicePrice
                  }>{`${item.price} ${t.salonProfile.services.price}`}</Text>
                <TouchableOpacity
                  onPress={() => {
                    toggleService(item.id, item);
                    // Check if there are any services left after removal
                    if (Object.keys(selectedServices).length <= 1) {
                      setModalVisible(false);
                    }
                  }}
                  style={modalStyles.removeButton}>
                  <Text style={modalStyles.removeButtonText}>
                    {t.salonProfile.services.remove}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <View>
                <View style={modalStyles.summary}>
                  <Text style={modalStyles.summaryText}>
                    {t.salonProfile.services.subtotal}:{' '}
                    {totalPrice - serviceFees} {t.salonProfile.services.price}
                  </Text>
                  <Text style={modalStyles.summaryText}>
                    {t.salonProfile.services.serviceFees}: {serviceFees}{' '}
                    {t.salonProfile.services.price}
                  </Text>
                  <Text style={modalStyles.summaryText}>
                    {t.salonProfile.services.total}: {totalPrice}{' '}
                    {t.salonProfile.services.price}
                  </Text>
                </View>
                <View style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    style={modalStyles.continueButton}
                    onPress={() => {
                      if (isGuestMode) {
                        setGuestRestrictedModalVisible(true);
                        setModalVisible(false);
                        return;
                      }
                      setModalVisible(false);
                      setDateModalVisible(true);
                    }}>
                    <Text style={modalStyles.bookButtonText}>
                      {t.salonProfile.services.actions.continue}
                    </Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    style={modalStyles.bookButton}
                    onPress={() => {
                      setModalVisible(false);
                      setReviewModalVisible(true);
                    }}>
                       <Text style={modalStyles.continueButtonText}>
                      {t.salonProfile.services.actions.continue}
                    </Text>

                  </TouchableOpacity> */}
                </View>
              </View>
            }
          />
        </View>
      </Modal>
    );
  };

  const onShare = useCallback(async () => {
    try {
      const current_salon = salonData?.salons;
      const contactName = current_salon?.name || salon.name;
      const phoneNumber = current_salon?.phone_number;

      const description =
        salonData?.salons?.bio || t.salonProfile.about.noDescription;

      const message =
        `${t.editProfile.Name}: ${contactName}\n` +
        `${t.editProfile.phone}: ${phoneNumber}\n` +
        `${t.editProfile.description}: ${description}\n`;

      const result = await Share.share({message});

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [salonData]); // ✅ add dependencies here

  // const handleConfirm = useCallback(() => {
  //   // Handle booking confirmation logic here
  //   handleBookingSuccess();
  //   setReviewModalVisible(false);
  //   // setModalVisible(false);
  // }, []);
  return (
    <View style={{flex: 1, position: 'relative'}}>
      <StatusBar
        backgroundColor={
          modalVisible || dateModalVisible ? Colors.black : 'transparent'
        }
        barStyle="light-content"
        translucent={true}
      />
      <ImageBackground
        source={require('../../../assets/images/pink-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <SafeAreaView
        style={[styles.mainContainer, {backgroundColor: 'transparent'}]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.scrollView, {backgroundColor: 'transparent'}]}>
          <View style={[styles.container, {backgroundColor: 'transparent'}]}>
            <ProfileHeader
              image={salonData?.salons.image_url}
              name={salonData?.salons?.name || salon.name}
              title={
                salonData?.salons?.bio || t.salonProfile.about.noDescription
              }
              onShare={onShare}
              rating={4.5}
              reviews={salonData?.salons?.ratings_received?.length || 0}
              favorite={isFavorite}
              onBackPress={() => navigation.goBack()}
              onFavoritePress={handleFavoritePress}
              isProvider={true}
              back={true}
            />
            <View style={[styles.tabs, isRTL && styles.tabsRTL]}>
              {['Services', 'Portfolio', 'Reviews'].map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}>
                    {t.salonProfile.tabs[
                      tab.toLowerCase() as keyof typeof t.salonProfile.tabs
                    ] || tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.content}>{renderContent()}</View>
          </View>
        </ScrollView>
        {!isGuestMode && <Footer />}
        {renderModal()}
        <ReviewConfirmModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onConfirm={handleBookingSuccess}
          selectedServices={Object.values(selectedServices)}
          // discountCode={'DISCOUNT10'}
          discountAmount={0.0}
          paymentMethod={t.booking.reviewModal.payAtCenter}
          isRTL={isRTL}
          service_fee={salonData?.salons?.service_fee || 0}
        />
        <DateSelectionModal
          visible={dateModalVisible}
          onClose={() => setDateModalVisible(false)}
          salonId={salon.id}
          totalDuration={calculateTotalDuration()}
          selectedServices={Object.values(selectedServices)}
          onBookingSuccess={handleBookingSuccess}
          service_fee={salonData?.salons?.service_fee || 0}
        />
        <GuestRestrictedModal
          visible={guestRestrictedModalVisible}
          onClose={() => setGuestRestrictedModalVisible(false)}
          onLogin={handleGuestModalLogin}
          onSignup={handleGuestModalSignup}
        />

        {/* Debug Panel */}
        {/*<DebugPanel*/}
        {/*  visible={debugPanelVisible}*/}
        {/*  onClose={() => setDebugPanelVisible(false)}*/}
        {/*  debugInfo={{*/}
        {/*    location: selectedAddress ? {*/}
        {/*      lat: parseFloat(selectedAddress.latitude),*/}
        {/*      lng: parseFloat(selectedAddress.longitude)*/}
        {/*    } : undefined,*/}
        {/*    selectedAddress: selectedAddress,*/}
        {/*    nearbySalons: [], // You can add nearby salons data here if available*/}
        {/*    apiCalls: {*/}
        {/*      locationApi: {*/}
        {/*        status: 'N/A',*/}
        {/*        success: !!selectedAddress*/}
        {/*      },*/}
        {/*      nearbySalonsApi: {*/}
        {/*        status: 'N/A',*/}
        {/*        success: false,*/}
        {/*        salonsCount: 0*/}
        {/*      }*/}
        {/*    },*/}
        {/*    errors: []*/}
        {/*  }}*/}
        {/*/>*/}

        {/* Debug Button - Only show in development */}
        {/*development{__DEV__ && (*/}
        {/*  <TouchableOpacity*/}
        {/*    style={modalStyles.debugButton}*/}
        {/*    onPress={() => setDebugPanelVisible(true)}>*/}
        {/*    <Text style={modalStyles.debugButtonText}>🔍 Debug</Text>*/}
        {/*  </TouchableOpacity>*/}
        {/*)}*/}
        {activeTab === 'Services' &&
          Object.values(selectedServices).length > 0 && (
            <View
              style={[
                modalStyles.stickyContinueContainer,
                isGuestMode && {bottom: 0},
              ]}>
              <TouchableOpacity
                style={modalStyles.stickyContinueButton}
                onPress={() => {
                  if (isGuestMode) {
                    setGuestRestrictedModalVisible(true);
                    return;
                  }
                  setModalVisible(true);
                }}>
                <Text style={modalStyles.stickyContinueButtonText}>
                  {t.salonProfile.services.actions.continue}
                </Text>
              </TouchableOpacity>
            </View>
          )}
      </SafeAreaView>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: Dimensions.get('window').height * 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Maitree-Bold',
    color: Colors.white,
    // marginBottom: 20,
  },
  closeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: Colors.white,
  },
  closeButtonNotRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  serviceName: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  serviceDuration: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'Maitree-Regular',
  },
  servicePrice: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Maitree-Bold',
  },
  removeButton: {
    backgroundColor: Colors.red,
    padding: 5,
    borderRadius: 8,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.black,
    fontSize: 10,
    fontFamily: 'Maitree-Bold',
  },
  summary: {
    borderColor: Colors.black,
    paddingTop: 10,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Maitree-SemiBold',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  continueButton: {
    backgroundColor: Colors.black,
    padding: 15,
    borderRadius: 34,
    borderColor: Colors.gold,
    borderWidth: 1,
    alignItems: 'center',
    flex: 1,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Bold',
  },
  bookButton: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 34,
    alignItems: 'center',
    flex: 1,
  },
  bookButtonText: {
    color: Colors.gold,
    fontSize: 16,
    fontFamily: 'Maitree-Bold',
  },
  subTitle: {
    fontSize: 16,
    fontFamily: 'Maitree-SemiBold',
    color: Colors.black,
    marginTop: 20,
  },
  slotTitle: {
    fontSize: 14,
    fontFamily: 'Maitree-Bold',
    color: Colors.black,
    marginTop: 10,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeSlotButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginBottom: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.black,
  },
  timeSlotSelected: {
    backgroundColor: Colors.black,
  },
  timeSlotDisabled: {
    backgroundColor: Colors.softGray,
  },
  timeSlotTextDisabled: {
    color: Colors.softGray,
  },
  noServicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginTop: 20,
  },
  noServicesText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Regular',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.black,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginTop: 20,
  },
  emptyText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Regular',
    textAlign: 'center',
  },
  portfolioList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  portfolioItem: {
    width: '48%',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  stickyContinueContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 66,
    // backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  stickyContinueButton: {
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 34,
    width: '100%',
    alignItems: 'center',
  },
  stickyContinueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Bold',
  },
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  debugButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontFamily: 'Maitree-Bold',
  },
});
export default SalonProfileScreen;
