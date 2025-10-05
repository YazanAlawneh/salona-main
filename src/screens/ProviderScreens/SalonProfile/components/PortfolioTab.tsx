import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import styles from '../SalonProfile.styles';
import Colors from '../../../../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';
import {RootState} from '../../../../redux/store';
import {useTranslation} from '../../../../contexts/TranslationContext';
import ImageView from 'react-native-image-viewing';
import {launchImageLibrary} from 'react-native-image-picker';

interface PortfolioTabProps {
  assets: Array<{id: number; file_path: string}>;
  onAssetsUpdated?: () => void;
}

const PortfolioTab: React.FC<PortfolioTabProps> = ({
  assets,
  onAssetsUpdated,
}) => {
  const {user, token} = useSelector((state: RootState) => state.auth);
  const salonId = user?.id;
  const {t, isRTL} = useTranslation();

  // Instagram-style grid constants
  const numColumns = 3;
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 16; // 8px padding on each side
  const imageSize = (screenWidth - containerPadding) / numColumns; // Account for small padding

  // Image viewer state - useState for initial open index, useRef for live tracking
  const [isViewerVisible, setViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  // Optimistic updates for instant display of uploaded images
  const [optimisticAssets, setOptimisticAssets] = useState<
    Array<{id: number; file_path: string}>
  >([]);

  // Combine server assets with optimistic assets for instant display
  const displayAssets = [...assets, ...optimisticAssets];

  // useEffect(() => {
  //   console.log('assets', assets);
  // }, [assets]);

  const handleDeleteImage = async (assetId: number) => {
    try {
      // Check if this is an optimistic asset (temporary ID)
      if (assetId > Date.now()) {
        // Remove from optimistic assets
        setOptimisticAssets(prev => prev.filter(asset => asset.id !== assetId));
        return;
      }

      if (!token) {
        Alert.alert(t.salonProfile.portfolio.uploadError);
        return;
      }

      const response = await fetch(
        `https://bella-glam.com/api/salons/${assetId}/delete-asset`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({asset_id: assetId}),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Show success message
        Alert.alert(t.salonProfile.portfolio.deleteSuccess);

        // Refetch assets after successful deletion
        if (onAssetsUpdated) {
          onAssetsUpdated();
        }

        // Close viewer if it's open
        if (isViewerVisible) {
          setViewerVisible(false);
        }
      } else {
        Alert.alert(
          t.salonProfile.portfolio.uploadError,
          t.salonProfile.portfolio.deleteError,
        );
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert(
        t.salonProfile.portfolio.uploadError,
        t.salonProfile.portfolio.deleteError,
      );
    }
  };

  const openViewer = (index: number) => {
    setCurrentIndex(index);
    currentIndexRef.current = index; // Sync both state and ref
    setViewerVisible(true);
  };

  const handleImageIndexChange = (index: number) => {
    currentIndexRef.current = index; // Fast, no re-render
  };

  const handleDeleteCurrentImage = () => {
    const assetId = displayAssets[currentIndexRef.current]?.id;
    if (assetId) {
      handleDeleteImage(assetId);
    }
  };

  const handleUploadImages = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 0,
      });

      if (result.didCancel) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        // Add optimistic assets immediately for instant display
        const newOptimisticAssets = result.assets.map((asset, index) => ({
          id: Date.now() + index, // Temporary ID
          file_path: asset.uri || '',
        }));

        setOptimisticAssets(prev => [...prev, ...newOptimisticAssets]);

        const formData = new FormData();
        result.assets.forEach((asset, index) => {
          if (asset.uri) {
            formData.append('assets[]', {
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || `image${index}.jpg`,
            } as any);
          }
        });

        // Add the token to the request headers
        const response = await fetch(
          `https://bella-glam.com/api/salons/${salonId}/assets`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Upload response:', data);

        // Clear optimistic assets after successful upload
        setOptimisticAssets([]);

        // Show success message
        Alert.alert(
          t.salonProfile.portfolio.uploadSuccess ||
            'Images uploaded successfully!',
        );

        // Call the callback to refresh assets after successful upload
        if (onAssetsUpdated) {
          onAssetsUpdated();
        }

        return data;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      // Clear optimistic assets on error
      setOptimisticAssets([]);
      Alert.alert(
        t.salonProfile.portfolio.uploadError || 'Upload failed',
        'Please try again.',
      );
      throw error;
    }
  };

  const renderItem = ({item, index}: {item: any; index: number}) => {
    return (
      <TouchableOpacity
        style={[
          styles.portfolioItem,
          {
            width: imageSize,
            height: imageSize,
            margin: 1, // Small margin between images
          },
        ]}
        onPress={() => openViewer(index)}>
        <Image
          source={{uri: `https://bella-glam.com/${item.file_path}`}}
          style={[
            styles.portfolioImage,
            {
              width: imageSize - 2, // Account for margin
              height: imageSize - 2,
              borderRadius: 0, // Remove border radius for full coverage
              backgroundColor: Colors.softGray, // Use existing color for loading background
            },
          ]}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.deleteButton, isRTL && styles.deleteButtonRTL]}
          onPress={() => handleDeleteImage(item.id)}>
          <Icon name="delete" size={20} color={Colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <TouchableOpacity
      style={[styles.uploadButton, isRTL && styles.uploadButtonRTL]}
      onPress={handleUploadImages}>
      <Icon name="add" size={24} color={Colors.gold} />
      <Text style={[styles.uploadText, isRTL && styles.uploadTextRTL]}>
        {t.salonProfile.portfolio.uploadImages}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, isRTL && styles.emptyContainerRTL]}>
      <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>
        {t.salonProfile.portfolio.noImages}
      </Text>
    </View>
  );

  const renderImageViewerHeader = () => (
    <View style={styles.viewerHeader}>
      <TouchableOpacity
        style={styles.viewerDeleteButton}
        onPress={handleDeleteCurrentImage}>
        <Icon name="delete" size={24} color={Colors.black} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.viewerCloseButton}
        onPress={() => setViewerVisible(false)}>
        <Icon name="close" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.portfolioContainer,
        isRTL && styles.portfolioContainerRTL,
      ]}>
      <StatusBar
        backgroundColor={isViewerVisible ? Colors.white : Colors.transparent}
        barStyle={isViewerVisible ? 'dark-content' : 'light-content'}
      />

      <FlatList
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        data={displayAssets}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={numColumns}
        key={`${numColumns}-${displayAssets.length}`} // Better key for re-rendering
        contentContainerStyle={[
          styles.portfolioList,
          isRTL && styles.portfolioListRTL,
        ]}
        showsVerticalScrollIndicator={false}
        style={{flex: 1}} // Ensure FlatList takes full width
      />

      <ImageView
        images={displayAssets.map(img => ({
          uri: `https://bella-glam.com/${img.file_path}`,
        }))}
        imageIndex={currentIndex}
        visible={isViewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        onImageIndexChange={handleImageIndexChange}
        HeaderComponent={renderImageViewerHeader}
      />
    </View>
  );
};

export default PortfolioTab;
