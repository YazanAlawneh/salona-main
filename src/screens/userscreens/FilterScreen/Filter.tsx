import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Colors from '../../../constants/Colors';
import TagSelectionSection from '../../../components/TagSelection/TagSelection';
import Footer from '../../../components/Footer/Footer';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../contexts/TranslationContext';
interface Tag {
  label: string;
  value?: string;
  icon?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image_url: string;
}

const FilterScreen: React.FC = () => {
  const { t, language, isRTL } = useTranslation();
  const navigation = useNavigation();
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [categories, setCategories] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        'https://bella-glam.com/api/categories',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Transform categories to match Tag interface
        const transformedCategories = data.categories.map((cat: Category) => ({
          label: cat.name,
          value: cat.id.toString(),
          description: cat.description,
          imageUrl: cat.image_url
        }));
        setCategories(transformedCategories);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

 

  const ratings: Tag[] = [
    { label: '1 Star', value: '1', icon: 'star' },
    { label: '2 Star', value: '2', icon: 'star' },
    { label: '3 Star', value: '3', icon: 'star' },
    { label: '4 Star', value: '4', icon: 'star' },
    { label: '5 Star', value: '5', icon: 'star' },
  ];

  const priceRanges: Tag[] = [
    { label: '0 JOD - 50 JOD', value: '0-50' },
    { label: '50 JOD - 100 JOD', value: '50-100' },
    { label: '100 JOD - 500 JOD', value: '100-500' },
    { label: '500 JOD+', value: '500-more' },
  ];

  const handlePriceRangeSelect = (selectedTags: string[]) => {
    console.log('Price range selected:', selectedTags);
    setSelectedPriceRange(selectedTags);
  };

  const handleCategoriesSelect = (selectedTags: string[]) => {
    setSelectedCategories(selectedTags);
  };

  const handleRatingsSelect = (selectedTags: string[]) => {
    const lastSelected = selectedTags[selectedTags.length - 1];
    setSelectedRatings(lastSelected ? [lastSelected] : []);
  };

  const handleApplyFilters = () => {
    // Get the price range value if one is selected
    const priceRangeValue = selectedPriceRange.length > 0 
      ? priceRanges.find(range => range.label === selectedPriceRange[0])?.value 
      : '';

    // Get the category IDs and names from the selected categories
    const categoryIds = selectedCategories.map(catLabel => 
      categories.find(cat => cat.label === catLabel)?.value
    ).filter(Boolean);

    // Get the category names for display
    const categoryNames = selectedCategories.map(catLabel => 
      categories.find(cat => cat.label === catLabel)?.label
    ).filter(Boolean);

    // Get the rating value (single selection)
    const ratingValue = selectedRatings.length > 0
      ? ratings.find(r => r.label === selectedRatings[0])?.value
      : '';

    const filters = {
      price_range: priceRangeValue || '',
      categories: categoryIds,
      categoryNames: categoryNames,
      rating: ratingValue
    };

    console.log('Applying filters:', filters);
    
    navigation.navigate('ExploreScreen', {
      filters
    });
  };

  const hasAnyFilterSelected = () => {
    const hasFilters = selectedPriceRange.length > 0 || 
                      selectedCategories.length > 0 || 
                      selectedRatings.length > 0;
    return hasFilters;
  };

  const renderCategoriesSection = () => {
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>{t.filter.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TagSelectionSection 
        title={t.filter.categories} 
        tags={categories} 
        onSelectionChange={handleCategoriesSelect}
      />
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          {/* <SearchBarWithMenu
            onSearchChange={handleSearch}
            onMenuPress={handleMenuPress}
          /> */}

          {renderCategoriesSection()}
          
          <TagSelectionSection 
            title={t.filter.ratings} 
            tags={ratings} 
            onSelectionChange={handleRatingsSelect}
            singleSelect={true}
          />
          
          <TagSelectionSection 
            title={t.filter.price} 
            tags={priceRanges} 
            onSelectionChange={handlePriceRangeSelect}
            singleSelect={true}
          />
        </View>
      </ScrollView>

      <View style={styles.searchButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.searchButton,
            !hasAnyFilterSelected() && styles.disabledButton
          ]}
          onPress={handleApplyFilters}
          disabled={!hasAnyFilterSelected()}
        >
          <Text style={styles.searchButtonText}>{t.filter.applyFilters}</Text>
        </TouchableOpacity>
      </View>
      
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContainer: {
    flex: 1,
    
  },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    padding: 20,
    paddingBottom: 80,
  },
  searchButtonContainer: {
    padding: 20,
    backgroundColor: Colors.black,
    borderTopWidth: 1,
    borderTopColor: Colors.gold,
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  searchButton: {
    backgroundColor: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gold,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-SemiBold',
  },
  disabledButton: {
    opacity: 0.5,
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
    fontFamily: 'Maitree-Regular',
  },
  retryButton: {
    backgroundColor: Colors.gold,
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Maitree-SemiBold',
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 18,
    marginBottom: 15,
    fontFamily: 'Maitree-Medium',
  },
  optionText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Maitree-Regular',
  },
  selectedOptionText: {
    color: Colors.gold,
    fontSize: 16,
    fontFamily: 'Maitree-Medium',
  },
  tagText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
  },
  selectedTagText: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: 'Maitree-Medium',
  },
});

export default FilterScreen;
