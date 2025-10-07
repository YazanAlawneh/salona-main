import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  I18nManager,
  ScrollView,
} from 'react-native';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from '../../contexts/TranslationContext';

const {width} = Dimensions.get('window');

interface ServiceItem {
  id: string;
  title: string;
  image: any;
  isService?: boolean;
}

interface SalonItem extends ServiceItem {
  distance?: string;
  time?: string;
  rating?: string;
}

interface BeautyServicesSectionProps {
  title: string | React.ReactElement;
  data: Array<ServiceItem | SalonItem>;
  onViewAllPress?: () => void;
  onItemPress?: (item: ServiceItem | SalonItem) => void;
}

const BeautyServicesSection: React.FC<BeautyServicesSectionProps> = ({
  title,
  data,
  onViewAllPress,
  onItemPress,
}) => {
  const {isRTL, t} = useTranslation();

  const renderItem = (item: ServiceItem | SalonItem) => {
    if (item.isService) {
      return (
        <TouchableOpacity
          style={styles.serviceContainer}
          onPress={() => onItemPress?.(item)}>
          <Image source={item.image} style={styles.serviceImage} />
          <Text style={styles.serviceTitle}>{item.title}</Text>
        </TouchableOpacity>
      );
    }

    const salonItem = item as SalonItem;
    return (
      <TouchableOpacity
        style={styles.salonCard}
        onPress={() => onItemPress?.(item)}>
        <View style={styles.imageContainer}>
          <Image
            source={
              typeof item.image === 'string' ? {uri: item.image} : item.image
            }
            style={styles.salonImage}
          />
          {salonItem.rating && (
            <View style={styles.ratingOverlay}>
              <Icon name="star" size={12} color="rgb(253, 217, 11)" />
              <Text style={styles.ratingOverlayText}>{salonItem.rating}</Text>
            </View>
          )}
        </View>
        <View style={styles.salonInfo}>
          <Text style={styles.salonName}>{item.title}</Text>
          <View style={styles.locationContainer}>
            <Icon
              name="location-on"
              size={15}
              color={Colors.gold}
              style={styles.locationIcon}
            />
            <Text numberOfLines={1} style={styles.locationText}>
              {salonItem.distance} • {salonItem.time}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {flexDirection: !isRTL ? 'row-reverse' : 'row'},
        ]}>
        {/* {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={[styles.viewAll]}>{t.home.viewAll}</Text>
          </TouchableOpacity>
        )} */}
        <Text style={[styles.title]}>{title}</Text>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle={{padding:16 }}
        style={[
          styles.itemsContainer,
          data[0]?.isService ? styles.servicesGrid : styles.salonsGrid,
          // {
          //   flexDirection: isRTL ? 'row-reverse' : 'row',
          // },
        ]}>
        {data.map(item => (
          <View
            key={item.id}
            style={[data[0]?.isService ? {} : styles.salonWrapper]}>
            {renderItem(item)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  header: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    justifyContent: 'flex-end',
    marginBottom: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    paddingHorizontal: 16,
    // alignSelf: 'flex-start',
  },

  viewAll: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  // Services styles
  servicesGrid: {
    justifyContent: 'flex-start',
  },
  serviceContainer: {
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 5,
  },
  serviceTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    textAlign: 'center',
  },
  // Salons styles
  salonsGrid: {
    flexDirection: 'row',
    // paddingHorizontal: 0,
    width: '100%',
    paddingHorizontal: 12,
  },
  salonWrapper: {
    // width: '48.8%',
    marginBottom: 16,
  marginRight: 16 ,
    // alignItems: 'flex-end',
    // alignSelf: 'flex-end',
    // justifyContent: 'flex-end',
  },
  salonCard: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    shadowColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  salonImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  salonInfo: {
    padding: 12,
    backgroundColor: Colors.black,
  },
  salonName: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginLeft: 4,
    marginRight: 4,
    flex: 1,
    opacity: 0.9,
  },
  ratingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingOverlayText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

export default BeautyServicesSection;
