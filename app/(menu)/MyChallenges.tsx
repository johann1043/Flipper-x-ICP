import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import i18n from "../../languages/i18n";
import { API_URL } from '../../constants/constants';
import { getAuth } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';

const MyChallengesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const currentUser = auth.currentUser || null;

  const uid = currentUser?.uid;

  const params = useLocalSearchParams();

  const fetchPackages = async () => {
    if (!currentUser) {
      setError(i18n.t('myChallengesPage.userNotAuthenticated'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://${API_URL}:5001/api/challenge-packages/user/${uid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError(i18n.t('myChallengesPage.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (packages.length === 0) return;

    let updatedPackages = [...packages];
    if (params && params.id) {
      const additionalPackage = {
        id: params.id,
        package_name: params.package_name || 'Unnamed Package',
        package_description: params.package_description || 'No description provided.',
        package_image: params.package_image || '',
        package_category_1: params.package_category_1 || '',
        package_category_2: params.package_category_2 || '',
        package_category_3: params.package_category_3 || '',
        notice: params.notice || null,
      };
      updatedPackages.push(additionalPackage);
    }

    setPackages(updatedPackages);
  }, [JSON.stringify(params)]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <Text>{i18n.t('myChallengesPage.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const handleDeletePress = (packageId) => {
    Alert.alert(
      i18n.t('myChallengesPage.deletePackage'),
      i18n.t('myChallengesPage.deleteConfirmation'),
      [
        {
          text: i18n.t('myChallengesPage.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('myChallengesPage.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://${API_URL}:5001/api/challenge-packages/${packageId}`, {
                method: 'DELETE',
              });

              const result = await response.json(); // Parse the JSON response

              if (!response.ok) {
                if (result.error === "Package is used by a group") {
                  Alert.alert('Error', i18n.t('myChallengesPage.packageUsedByGroup'));
                  return;
                }
                throw new Error(result.error || 'Failed to delete package');
              }

              // Remove the deleted package from the state
              setPackages((prevPackages) => prevPackages.filter((pkg) => pkg.id !== packageId));
              Alert.alert('Success', i18n.t('myChallengesPage.deleteSuccess'));
            } catch (error) {
              console.error('Error deleting package:', error);
              Alert.alert('Error', i18n.t('myChallengesPage.deleteError'));
            }
          },
        },
      ]
    );
};
  

  const renderPackageItem = ({ item }) => (
    <View style={styles.packageItem}>
      <Image source={{ uri: item.package_image || 'https://via.placeholder.com/100' }} style={styles.packageImage} />
      <Text style={styles.packageName}>{item.package_name}</Text>
      <TouchableOpacity onPress={() => handleDeletePress(item.id)}>
        <MaterialCommunityIcons name="trash-can" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{i18n.t('myChallengesPage.noPackages')}</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(menu)/CreatePackage/NamePackage')}
          >
            <Text style={styles.createButtonText}>{i18n.t('myChallengesPage.createButton')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPackageItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.red,
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  packageImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    flex: 1,
  },
  trashIcon: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.gray,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyChallengesPage;
