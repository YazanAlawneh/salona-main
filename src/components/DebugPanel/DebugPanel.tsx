import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../constants/Colors';

interface DebugInfo {
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  nearbySalons?: any[];
  selectedAddress?: any;
  apiCalls?: {
    locationApi?: any;
    nearbySalonsApi?: any;
    geocodingApi?: any;
    distanceMatrixApi?: any;
  };
  errors?: string[];
}

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
  debugInfo: DebugInfo;
}

const DebugPanel: React.FC<DebugPanelProps> = ({visible, onClose, debugInfo}) => {
  const [activeTab, setActiveTab] = useState<'location' | 'salons' | 'api' | 'errors'>('location');

  const renderLocationInfo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📍 Location Information</Text>
      
      {debugInfo.location ? (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Current Location:</Text>
          <Text style={styles.infoValue}>
            Lat: {debugInfo.location.lat.toFixed(6)}
          </Text>
          <Text style={styles.infoValue}>
            Lng: {debugInfo.location.lng.toFixed(6)}
          </Text>
          {debugInfo.location.accuracy && (
            <Text style={styles.infoValue}>
              Accuracy: {debugInfo.location.accuracy}m
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.noDataText}>No location data available</Text>
      )}

      {debugInfo.selectedAddress && (
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>🏠 Selected Address</Text>
          <Text style={styles.infoLabel}>Description:</Text>
          <Text style={styles.infoValue}>{debugInfo.selectedAddress.description}</Text>
          <Text style={styles.infoLabel}>Coordinates:</Text>
          <Text style={styles.infoValue}>
            Lat: {debugInfo.selectedAddress.latitude}
          </Text>
          <Text style={styles.infoValue}>
            Lng: {debugInfo.selectedAddress.longitude}
          </Text>
        </View>
      )}
    </View>
  );

  const renderSalonsInfo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏪 Nearby Salons</Text>
      
      {debugInfo.nearbySalons && debugInfo.nearbySalons.length > 0 ? (
        <View style={styles.salonsList}>
          {debugInfo.nearbySalons.map((salon, index) => (
            <View key={salon.id || index} style={styles.salonItem}>
              <Text style={styles.salonName}>{salon.name}</Text>
              <Text style={styles.salonInfo}>
                ID: {salon.id} | Distance: {salon.distance?.toFixed(2)}km
              </Text>
              <Text style={styles.salonInfo}>
                Coordinates: {salon.salon_latitude}, {salon.salon_longitude}
              </Text>
              {salon.travelTime && (
                <Text style={styles.salonInfo}>Travel Time: {salon.travelTime}</Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No nearby salons data available</Text>
      )}
    </View>
  );

  const renderApiInfo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🌐 API Calls</Text>
      
      {debugInfo.apiCalls?.locationApi && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Location API:</Text>
          <Text style={styles.infoValue}>
            Status: {debugInfo.apiCalls.locationApi.status}
          </Text>
          <Text style={styles.infoValue}>
            Success: {debugInfo.apiCalls.locationApi.success ? 'Yes' : 'No'}
          </Text>
        </View>
      )}

      {debugInfo.apiCalls?.nearbySalonsApi && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Nearby Salons API:</Text>
          <Text style={styles.infoValue}>
            Status: {debugInfo.apiCalls.nearbySalonsApi.status}
          </Text>
          <Text style={styles.infoValue}>
            Success: {debugInfo.apiCalls.nearbySalonsApi.success ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoValue}>
            Salons Count: {debugInfo.apiCalls.nearbySalonsApi.salonsCount || 0}
          </Text>
        </View>
      )}

      {debugInfo.apiCalls?.geocodingApi && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Geocoding API:</Text>
          <Text style={styles.infoValue}>
            Status: {debugInfo.apiCalls.geocodingApi.status}
          </Text>
          <Text style={styles.infoValue}>
            Results: {debugInfo.apiCalls.geocodingApi.resultsCount || 0}
          </Text>
        </View>
      )}

      {debugInfo.apiCalls?.distanceMatrixApi && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Distance Matrix API:</Text>
          <Text style={styles.infoValue}>
            Status: {debugInfo.apiCalls.distanceMatrixApi.status}
          </Text>
          <Text style={styles.infoValue}>
            Calls Made: {debugInfo.apiCalls.distanceMatrixApi.callsCount || 0}
          </Text>
        </View>
      )}
    </View>
  );

  const renderErrorsInfo = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>❌ Errors</Text>
      
      {debugInfo.errors && debugInfo.errors.length > 0 ? (
        <View style={styles.errorsList}>
          {debugInfo.errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              {error}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No errors recorded</Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'location':
        return renderLocationInfo();
      case 'salons':
        return renderSalonsInfo();
      case 'api':
        return renderApiInfo();
      case 'errors':
        return renderErrorsInfo();
      default:
        return renderLocationInfo();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>🔍 Debug Panel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'location' && styles.activeTab]}
              onPress={() => setActiveTab('location')}>
              <Text style={[styles.tabText, activeTab === 'location' && styles.activeTabText]}>
                Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'salons' && styles.activeTab]}
              onPress={() => setActiveTab('salons')}>
              <Text style={[styles.tabText, activeTab === 'salons' && styles.activeTabText]}>
                Salons
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'api' && styles.activeTab]}
              onPress={() => setActiveTab('api')}>
              <Text style={[styles.tabText, activeTab === 'api' && styles.activeTabText]}>
                API
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'errors' && styles.activeTab]}
              onPress={() => setActiveTab('errors')}>
              <Text style={[styles.tabText, activeTab === 'errors' && styles.activeTabText]}>
                Errors
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {renderTabContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.8,
    backgroundColor: Colors.black,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Maitree-Bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.gold,
  },
  activeTab: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
  },
  activeTabText: {
    color: Colors.black,
    fontFamily: 'Maitree-Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Maitree-Bold',
    color: Colors.gold,
    marginBottom: 12,
  },
  infoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Maitree-SemiBold',
    color: Colors.white,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginBottom: 2,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  salonsList: {
    flex: 1,
  },
  salonItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  salonName: {
    fontSize: 14,
    fontFamily: 'Maitree-Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  salonInfo: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginBottom: 2,
  },
  errorsList: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.red,
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 4,
  },
});

export default DebugPanel;
