import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import Colors from '../../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from '../../../../contexts/TranslationContext';
interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
}

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (selectedCategories: number[]) => void;
  initialSelectedCategories?: number[];
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSelectedCategories = [],
}) => {
  const {t, isRTL} = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialSelectedCategories,
  );

  useEffect(() => {
    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://bella-glam.com/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to fetch categories',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Format categories exactly as required
      const requestBody = {
        categories: selectedCategories.map(id => ({
          id: id,
        })),
      };

      // Log API call details
      console.log('=== Update Categories API Call ===');
      console.log(
        'URL:',
        'https://bella-glam.com/api/salons/update-salon-category',
      );
      console.log('Method:', 'POST');
      console.log('Headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(
        'https://bella-glam.com/api/salons/update-salon-category',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      const responseData = await response.json();

      // Log API response
      console.log('=== Update Categories API Response ===');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(responseData, null, 2));

      if (responseData.success) {
        onSave(selectedCategories);
        onClose();
      }
    } catch (error) {
      setError('Could not update categories');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.categoriesList}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategories.includes(category.id) &&
                styles.selectedCategory,
            ]}
            onPress={() => toggleCategory(category.id)}>
            <View style={styles.categoryContent}>
              <Image
                source={{uri: category.image_url}}
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <View style={styles.categoryTextContainer}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategories.includes(category.id) &&
                      styles.selectedCategoryText,
                  ]}>
                  {category.name}
                </Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
            </View>
            {selectedCategories.includes(category.id) && (
              <Icon name="check" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View
            style={[
              styles.header,
              {flexDirection: isRTL ? 'row-reverse' : 'row'},
            ]}>
            <Text style={styles.title}>{t.salonProfile.categories}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          {renderContent()}

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!categories || categories.length === 0) && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={!categories || categories.length === 0}>
            <Text style={styles.saveButtonText}>
              {t.salonProfile.setCategories}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.black,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 5,
  },
  categoriesList: {
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  categoryTextContainer: {
    flex: 1,
  },
  selectedCategory: {
    backgroundColor: Colors.gold,
  },
  categoryText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.7,
  },
  selectedCategoryText: {
    color: Colors.black,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: Colors.gold,
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CategoriesModal;
