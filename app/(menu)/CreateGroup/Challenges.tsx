// Updated ChooseChallenges Component
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';
import { API_URL } from '../../../constants/constants';
import { Task, PackageDetails } from '../../../context/Types';

const ChooseChallenges = () => {
  const router = useRouter();
  const { packageId, language, groupName } = useLocalSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const response = await fetch(
          `http://${API_URL}:5001/api/challenge-packages/${packageId}`
        );

        if (!response.ok) {
          throw new Error(i18n.t('challenges.fetch_error'));
        }

        const data = await response.json();
        setPackageDetails(data);
      } catch (error) {
        console.error('Error fetching package details:', error);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await fetch(
          `http://${API_URL}:5001/api/tasks/${packageId}?language=${language || 'en'}`
        );

        if (!response.ok) {
          throw new Error(i18n.t('challenges.fetch_error'));
        }

        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchPackageDetails();
      fetchTasks();
    }
  }, [packageId, language]);

  const showTaskDetails = (taskName: string, taskDescription: string) => {
    Alert.alert(taskName, taskDescription, [{ text: i18n.t('challenges.ok') }]);
  };

  const handleNext = () => {
    router.push({
      pathname: '/(menu)/CreateGroup/EndAndPrize',
      params: {
        packageId,
        groupName: groupName,
        packageImage: packageDetails?.package_image,
        language
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <Text style={styles.header}>{packageDetails?.package_name || i18n.t('challenges.loading')}</Text>

        {/* Package Image */}
        {packageDetails?.package_image ? (
          <Image source={{ uri: packageDetails.package_image }} style={styles.packageImage} />
        ) : (
          <View style={[styles.packageImage, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>{i18n.t('challenges.no_image')}</Text>
          </View>
        )}

        {/* Package Description */}
        <Text style={styles.descriptionText}>{packageDetails?.package_description || i18n.t('challenges.package_description')}</Text>

        {/* Tasks List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        ) : (
          tasks.map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <Text style={styles.taskPoints}>{task.task_points}</Text>
              <Ionicons name="cash" size={20} color="gold" style={styles.moneyIcon} />
              <Text style={styles.taskName}>{task.task_name}</Text>
              <TouchableOpacity onPress={() => showTaskDetails(task.task_name, task.task_description)}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.darkGreen} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.bottomButton} onPress={handleNext}>
        <Text style={styles.buttonText}>{i18n.t('challenges.next')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  packageImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#777',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
    textAlign: 'justify',
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  taskPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  moneyIcon: {
    marginRight: 10,
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  bottomButton: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ChooseChallenges;
