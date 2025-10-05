import {useState} from 'react';
import {useUploadAssetsMutation} from '../../../../redux/api/salonApi';
import {launchImageLibrary} from 'react-native-image-picker';
import {Platform} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../../../redux/store';

export const useSalonAssets = (
  salonId: number,
  onAssetsUpdated?: () => void,
) => {
  const [uploadAssets] = useUploadAssetsMutation();
  const {token} = useSelector((state: RootState) => state.auth);

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

        // Call the callback to refresh assets after successful upload
        if (onAssetsUpdated) {
          onAssetsUpdated();
        }

        return data;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleDeleteImage = async (assetId: number) => {
    // For now, we're not implementing delete functionality
    console.log('Delete not implemented yet');
  };

  return {
    handleUploadImages,
    handleDeleteImage,
  };
};
