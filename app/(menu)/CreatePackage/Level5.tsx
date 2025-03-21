import Colors from '../../../constants/Colors';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GroupData, useAppContext } from '../../../context/GroupContext';
import i18n from '../../../languages/i18n';
import { API_URL } from '../../../constants/constants';
import CategoryModal from '../../../components/Modals/CategoryModal';
import { auth } from '../../../constants/firebaseConfig';
import { Task } from '../../../context/Types';

const Level5Page = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [language, setLanguage] = useState<string>("");
  const uid = auth.currentUser?.uid || '';
  
  const { data } = useAppContext()

  const { setData } = useAppContext();

  useEffect(() => {
    if (data) {
      // Set the language if available in `data`
      if (data.language) setLanguage(data.language);
  
      // Fetch tasks after the language and `uid` are set
      if (data.language && uid) {
        const fetchTasks = async () => {
          try {
            const response = await fetch(`http://${API_URL}:5001/api/tasks/level/5?language=${data.language}&uid=${uid}`);
            if (!response.ok) {
              throw new Error(i18n.t('levels.fetchTasks'));
            }
            const fetchedTasks = await response.json();
            setTasks(fetchedTasks);
            setFilteredTasks(fetchedTasks); // Show all tasks initially
          } catch (error) {
            console.error('Error fetching tasks:', error);
          } finally {
            setLoading(false);
          }
        };
  
        fetchTasks();
      }
    }
  }, [data, uid]); // Combined dependencies
  


  // DropDownPicker states
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState([
      { label: i18n.t('levels.all'), value: 'all' },
      { label: i18n.t('levels.fitness'), value: 'Fitness' },
      { label: i18n.t('levels.creativity'), value: 'Creativity' },
      { label: i18n.t('levels.entertainment'), value: 'Entertainment' },
      { label: i18n.t('levels.networking'), value: 'Relationships and Networking' },
      { label: i18n.t('levels.health'), value: 'Health' },
      { label: i18n.t('levels.berlin'), value: 'Berlin' },
      { label: i18n.t('levels.foodAndDrinks'), value: 'Food and Drinks' },
      { label: i18n.t('levels.exploring'), value: 'Exploring' },
      { label: i18n.t('levels.winter'), value: 'Winter' },
      { label: i18n.t('levels.autumn'), value: 'Autumn' },
      { label: i18n.t('levels.selfDevelopment'), value: 'Self-development' },
      { label: i18n.t('levels.nightout'), value: 'Nightout' },
      { label: i18n.t('levels.relaxing'), value: 'Relaxing' },
      { label: i18n.t('levels.wellness'), value: 'Wellness' },
    ]);

  const currentSelectedTasks = selectedTasks.length;

  useEffect(() => {
    if (selectedCategory === 'all' || selectedCategory === null) {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter((task) => task.category === selectedCategory);
      setFilteredTasks(filtered);
    }
  }, [selectedCategory, tasks]);

  const handleTaskSelection = (task: Task) => {
    const taskId = task.id; // Extract the id from the task object
  
    setSelectedTasks((prevSelectedTasks) => {
      if (prevSelectedTasks.includes(taskId)) {
        return prevSelectedTasks.filter((id) => id !== taskId);
      } else if (prevSelectedTasks.length < 6) {
        return [...prevSelectedTasks, taskId];
      }
      return prevSelectedTasks; // No change if the limit is reached
    });
  };  

  const showTaskDetails = (taskName: string, taskDescription: string) => {
    Alert.alert(
          taskName, // Use the taskName parameter
          taskDescription, // Use the taskDescription parameter
          [{ text: i18n.t('levels.alertOk') }] // Localized button text
        );
  };

  const handleFinishButtonPress = async () => {
  
    const allSelectedTasks = [
      ...(data?.level1Tasks || []),
      ...(data?.level2Tasks || []),
      ...(data?.level3Tasks || []),
      ...(data?.level4Tasks || []),
      ...selectedTasks,
    ];    
  
    const payload = {
      packageName: data?.packageName || 'Default Package Name',
      language: data?.language || 'en',
      taskIds: allSelectedTasks,
      imagePath: 'package-images/Exploring.jpg',
      uid: uid,
    };
  
    try {
      const response = await fetch(`http://${API_URL}:5001/api/challenge-packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    
      if (!response.ok) {
        const errorResponse = await response.text();
        console.error('Error Response:', errorResponse);
        throw new Error(`Failed to create challenge package. Status: ${response.status}`);
      }
    
      const result = await response.json();
      
      // Navigate to the MyChallenges screen with the result as parameters
      router.push({
        pathname: '/(menu)/MyChallenges',
        params: {
          id: result.id.toString(),
        },
      });
      const data: GroupData = {
        authUid: "",
        groupAdminId: 0,
        groupDescription: "",
        groupEndDate: new Date().toISOString(),
        groupId: 0,
        groupImage: "",
        groupName: "",
        groupPackageId: 0,
        groupPin: "",
        groupPrize: 0,
        groupPrizeText: "",
        level1Tasks: [],
        level2Tasks: [],
        level3Tasks: [],
        level4Tasks: [],
        level5Tasks: [],
        packageName: '',
        language: ''
    }
      setData(data)
    } catch (error) {
      console.error('Error creating challenge package:', (error as Error).message);
      Alert.alert(
        i18n.t('levels.errorTitle'),
        (error as Error).message || i18n.t('levels.createChallengeError')
      );
    }    
    
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Dropdown Filter */}
      <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.CategoryButton}>
        <Text>{selectedCategory ? selectedCategory : i18n.t('package.select_category')}</Text>
      </TouchableOpacity>

      <CategoryModal
        isVisible={isModalVisible}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onClose={() => setIsModalVisible(false)}
      />

      {/* Progress Bar */}
      <Text style={styles.progressText}>
        {i18n.t("levels.taskSelected", { current: currentSelectedTasks, total: 6 })}
      </Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${((currentSelectedTasks) / 6) * 100}%`,
              backgroundColor: Colors.darkGreen,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>{i18n.t('levels.levelHeader', { level: 5 })}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        ) : (
          filteredTasks.map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <TouchableOpacity onPress={() => handleTaskSelection(task)}>
              <Ionicons
                name={selectedTasks.includes(task.id) ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedTasks.includes(task.id) ? Colors.darkGreen : '#ccc'}
                style={styles.checkboxIcon}
                />
              </TouchableOpacity>
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

      <TouchableOpacity
      style={[styles.nextButton, selectedTasks.length < 6 && styles.disabledButton]}
      disabled={selectedTasks.length < 6}
      onPress={() => handleFinishButtonPress()}
    >
      <Text style={styles.buttonText}>{i18n.t('levels.finishButton')}</Text>
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownContainer: {
    zIndex: 1000,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  scrollContainer: {
    paddingVertical: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  checkboxIcon: {
    marginRight: 10,
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
  nextButton: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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

export default Level5Page;
