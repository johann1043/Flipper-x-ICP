import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import i18n from '../../../languages/i18n';
import { API_URL } from '../../../constants/constants';
import CategoryModal from '../../../components/Modals/CategoryModal';
import Colors from '../../../constants/Colors';
import { auth } from '../../../constants/firebaseConfig';
import { Package } from '../../../context/Types';

const ChoosePackage = () => {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { groupName, language } = useLocalSearchParams();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // DropDownPicker states
  // const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState([
    { label: i18n.t('package.all_categories'), value: 'all' },
    { label: i18n.t('package.my_packages'), value: 'My Package' },
    { label: i18n.t('package.fitness'), value: 'Fitness' },
    { label: i18n.t('package.health'), value: 'Health' },
    { label: i18n.t('package.exploring'), value: 'Exploring' },
    { label: i18n.t('package.self_development'), value: 'Self-development' },
    { label: i18n.t('package.relationships_networking'), value: 'Relationships and Networking' },
    { label: i18n.t('package.food_drinks'), value: 'Food and Drinks' },
    { label: i18n.t('package.entertainment'), value: 'Entertainment' },
    { label: i18n.t('package.sports'), value: 'Sports' },
    { label: i18n.t('package.nightout'), value: 'Nightout' },
    { label: i18n.t('package.berlin'), value: 'Berlin' },
    { label: i18n.t('package.winter'), value: 'Winter' },
    { label: i18n.t('package.autumn'), value: 'Autumn' },
    { label: i18n.t('package.wellness'), value: 'Wellness' },
    { label: i18n.t('package.relaxing'), value: 'Relaxing' },
  ]);


  useEffect(() => {
    const fetchPackages = async () => {
      const currentUser = auth.currentUser || '';


      if (!currentUser) {
        setError(i18n.t('package.error_unauthenticated'));
        setLoading(false);
        return;
      }

      const uid = currentUser.uid;

      try {
        const response = await fetch(
          `http://${API_URL}:5001/api/challenge-packages?uid=${uid}&language=${language || 'en'}`, // Pass language
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(i18n.t('package.error_fetching_packages'));
        }

        const data = await response.json();
        setPackages(data);
        setFilteredPackages(data); // Initially show all packages
      } catch (error) {
        console.error('Error fetching packages:', error);
        setError(i18n.t('package.error_generic'));
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all' || selectedCategory === null) {
      setFilteredPackages(packages);
    } else {
      const filtered = packages.filter(
        (pkg) =>
          pkg.package_category_1 === selectedCategory ||
          pkg.package_category_2 === selectedCategory ||
          pkg.package_category_3 === selectedCategory
      );
      setFilteredPackages(filtered);
    }
  }, [selectedCategory, packages]);

  const handlePackagePress = (item: Package) => {
    router.push({
      pathname: '/(menu)/CreateGroup/Challenges',
      params: {
        packageId: item.id,
        packageName: item.package_name,
        packageDescription: item.package_description,
        groupName,
        language
      },
    });
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setIsModalVisible(false);
  };

  const renderPackage = ({ item }: { item: Package }) => (
    <TouchableOpacity
      style={styles.packageCard}
      onPress={() => handlePackagePress(item)}
    >
      {item.package_image ? (
        <Image
          source={{ uri: item.package_image }}
          style={styles.packageImage}
        />
      ) : (
        <View style={[styles.packageImage, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>{i18n.t('package.no_image')}</Text>
        </View>
      )}
      <View style={styles.packageInfo}>
        <Text style={styles.packageName}>{item.package_name}</Text>
        <Text style={styles.packageSubtitle}>{item.package_subtitle}</Text>
        <Text style={styles.packageCategories}>
          {item.package_category_1}, {item.package_category_2}, {item.package_category_3}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>{i18n.t('package.loading')}</Text>
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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.CategoryButton}>
        <Text>{selectedCategory ? selectedCategory : i18n.t('package.select_category')}</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredPackages}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={renderPackage}
      />
      <CategoryModal
        isVisible={isModalVisible}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownContainer: {
    zIndex: 1000, // Ensure DropDownPicker is above other UI elements
  },
  packageCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    elevation: 3,
  },
  packageImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#777',
  },
  packageInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packageSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  packageCategories: {
    fontSize: 12,
    color: '#777',
  },
  CategoryButton: {
    padding: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default ChoosePackage;
