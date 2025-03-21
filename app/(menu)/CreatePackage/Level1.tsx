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

const Level1Page = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { packageName, language } = useLocalSearchParams();
  const [level2Tasks, setLevel2Tasks] = useState<number[]>([]);
  const [level3Tasks, setLevel3Tasks] = useState<number[]>([]);
  const [level4Tasks, setLevel4Tasks] = useState<number[]>([]);
  const [level5Tasks, setLevel5Tasks] = useState<number[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const currentUser = auth.currentUser || null;
  const uid = currentUser?.uid;

  const { data } = useAppContext()

  const { setData } = useAppContext();

  useEffect(() => {
    if (data?.level1Tasks) {
      setSelectedTasks(data.level1Tasks);
    }
    if (data?.level2Tasks) {
      setLevel2Tasks(data.level2Tasks);
    }
    if (data?.level3Tasks) {
      setLevel3Tasks(data.level3Tasks);
    }
    if (data?.level4Tasks) {
      setLevel4Tasks(data.level4Tasks);
    }
    if (data?.level5Tasks) {
      setLevel5Tasks(data.level5Tasks);
    }
  }, [data]);

  useEffect(() => {
    if (data?.level1Tasks) {
      setSelectedTasks(data.level1Tasks);
    }
    if (data?.level2Tasks) {
      setLevel2Tasks(data.level2Tasks);
    }
    if (data?.level3Tasks) {
      setLevel3Tasks(data.level3Tasks);
    }
    if (data?.level4Tasks) {
      setLevel4Tasks(data.level4Tasks);
    }
    if (data?.level5Tasks) {
      setLevel5Tasks(data.level5Tasks);
    }
  }, [data]);

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


  const currentSelectedTasks = selectedTasks.length || 0;


  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/tasks/level/1?language=${language}&uid=${uid}`);
        if (!response.ok) {
          throw new Error(i18n.t('levels.fetchTasks'));
        }
        const data = await response.json();
        setTasks(data);
        setFilteredTasks(data); // Show all tasks initially
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

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


  const handleNextButtonPress = () => {
    if (selectedTasks.length >= 6) {
      router.push('/(menu)/CreatePackage/Level2');
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
        packageName: packageName as string,
        language: language as string,
        level1Tasks: selectedTasks,
        level2Tasks: level2Tasks,
        level3Tasks: level3Tasks,
        level4Tasks: level4Tasks,
        level5Tasks: level5Tasks,
      }
      setData(data)
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
              width: `${(currentSelectedTasks / 6) * 100}%`,
              backgroundColor: Colors.darkGreen,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>{i18n.t('levels.levelHeader', { level: 1 })}</Text>

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
        onPress={() => handleNextButtonPress()}
      >
        <Text style={styles.buttonText}>{i18n.t('levels.nextButton')}</Text>
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

export default Level1Page;
