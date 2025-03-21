import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';
import { auth } from '../../../constants/firebaseConfig';
import CameraModal from '../../../components/TaskCompletion/CameraModal';
import { useAppContext } from '../../../context/GroupContext';
import { API_URL } from '../../../constants/constants';
import { useWebSocket } from '../../../context/WebSocketContext';
import { Member, Task } from '../../../context/Types';

const MyChallenges = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupMember, setGroupMember] = useState<Member | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const uid = auth.currentUser?.uid || '';
  const { socket } = useWebSocket();
  const { socketRef } = useWebSocket();
  const { data } = useAppContext();
  const groupIdRef = useRef(data?.groupId);

  useEffect(() => {
    if (socket) {
      console.log("✅ Listening for messageDeleted event in Tasks screen...");

      const handleMessageDeleted = ({ task }: { task: Task }) => {
        if (task && task.auth_uid === uid) {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.task_id === task.task_id ? { ...t, completed: false } : t
            )
          );

          setCurrentPoints((prevPoints) => prevPoints - (task.points_earned || 0));
        }
      };

      socket.on("messageDeleted", handleMessageDeleted);

      return () => {
        if (socket) {
          console.log("🧹 Removing messageDeleted event listener in Tasks screen...");
          socket.off("messageDeleted", handleMessageDeleted);
        }
      };
    }
  }, [socket]);


  const fetchGroupMember = async () => {
    if (!data || !data.groupId) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.group_data_unavailable'));
      return;
    }



    if (!uid) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.user_id_unavailable'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://${API_URL}:5001/api/groups/${data.groupId}/members/${uid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(i18n.t('myChallengeList.fetch_member_failed'));
      }

      const memberData = await response.json();
      setGroupMember(memberData);
    } catch (error) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.fetch_member_failed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const fetchTasks = async () => {
    if (!data || !data.groupPackageId || !data.groupId) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.group_package_unavailable'));
      return;
    }


    if (!uid) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.user_id_unavailable'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://${API_URL}:5001/api/tasks-completion/${data.groupPackageId}?uid=${uid}&group_id=${data.groupId}&language=${data.language || 'en'}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(i18n.t('myChallengeList.fetch_tasks_failed'));
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const taskData = await response.json();
        setTasks(taskData);
      } else {
        throw new Error(i18n.t('myChallengeList.invalid_json_response'));
      }
    } catch (error) {
      Alert.alert(i18n.t('myChallengeList.error'), (error as Error).message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.groupId) {
      setGroupMember(null);
      setTasks([]);
      setCurrentPoints(0);
      fetchGroupMember();
      fetchTasks();
    }
  }, [data?.groupId]);

  useEffect(() => {
    if (groupMember?.points) {
      setCurrentPoints(groupMember.points);
    }
  }, [groupMember]);



  const handleTaskPress = (task: Task) => {
    if (task.completed) {
      Alert.alert(
        i18n.t('myChallengeList.delete_task'),
        i18n.t('myChallengeList.delete_task_confirmation'),
        [
          {
            text: i18n.t('myChallengeList.cancel'),
            style: "cancel",
          },
          {
            text: i18n.t('myChallengeList.confirm'), // Add a key (e.g., "text") to this property
            onPress: () => handleDeleteTask(task), // Correctly paired key-value
          },
        ]
      );
    } else {
      setSelectedTask(task);
      setModalVisible(true);
    }
  };

  useEffect(() => {
    groupIdRef.current = data?.groupId;
  }, [data?.groupId]);

  const handleDeleteTask = async (task: Task) => {
    const groupId = data?.groupId; // Get groupId from context
    const authUid = uid; // Get authUid from the authenticated user
    const { task_id } = task; // Destructure task_id from task

    if (!groupId || !authUid) {
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.missing_info'));
      return;
    }

    try {
      const response = await fetch(`http://${API_URL}:5001/api/task-completion`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task_id, groupId, authUid }),
      });

      const responseData = await response.json();

      // ✅ Check for API errors
      if (!response.ok) {
        console.error("❌ Error deleting task:", responseData);
        Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.delete_task_failed'));
        return;
      }

      // ✅ Update tasks list: Set `completed: false` for the deleted task
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.task_id === task_id ? { ...t, completed: false } : t
        )
      );

      const deletedTask = {
        auth_uid: uid,
        points_earned: task.task_points,
      }

      socketRef.current?.emit("deleteMessage", {
        groupId: groupIdRef.current, // ✅ Fix stale closure issue
        messageId: responseData.messageId,
        task: deletedTask,
      });

      // ✅ Navigate to GroupChat
      router.push('/(menu)/(tabs)/GroupChat');

    } catch (error) {
      console.error("❌ Error during task deletion:", error);
      Alert.alert(i18n.t('myChallengeList.error'), i18n.t('myChallengeList.delete_task_error'));
    }
  };

  const sendTaskCompletion = async (
    photo: { uri: string } | null,
    secondaryPhoto: { uri: string } | null,
    resetPhotos: () => void,
    closeModal: () => void
  ) => {

    if (!data) {
      console.error("Data is null.");
      return;
    }

    if (!selectedTask) {
      console.error("No task selected.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('auth_id', uid);
      formData.append('group_id', data.groupId.toString()); // Convert number to string
      formData.append('task_id', selectedTask.task_id.toString());
      formData.append('points_earned', selectedTask.task_points.toString());
      formData.append('language', data.language);

      if (photo) {
        formData.append('photoPath', {
          uri: photo.uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });
      }

      if (secondaryPhoto) {
        formData.append('secondaryPhotoPath', {
          uri: secondaryPhoto.uri,
          name: 'secondary_photo.jpg',
          type: 'image/jpeg',
        });
      }

      const response = await fetch(`http://${API_URL}:5001/api/task-completion`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      console.log(result.task);

      if (response.ok) {
        resetPhotos();
        closeModal();
        setModalVisible(false);

        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.task_id === selectedTask.task_id ? { ...task, completed: true } : task
          )
        );

        setCurrentPoints(prevPoints => prevPoints + result.task.task_points);

        if (socket) {
          socket.emit("sendMessage", {
            groupId: data?.groupId,
            auth_uid: uid,
            message: result.message,
            task: result.task,
          });
        } else {
          console.error("WebSocket is not connected.");
        }

        router.push('/(menu)/(tabs)/GroupChat');
      } else {
        console.error('Task completion failed:', result);
      }
    } catch (error) {
      console.error('Error sending task completion:', error);
    } finally {
      setLoading(false);
    }
  };




  const levels = [
    { level: 1, min: 0, max: 4 },
    { level: 2, min: 5, max: 11 },
    { level: 3, min: 12, max: 19 },
    { level: 4, min: 20, max: 29 },
    { level: 5, min: 30, max: Infinity },
  ];

  const getColorForLevel = (level: number) => {
    switch (level) {
      case 1:
        return Colors.level1;
      case 2:
        return Colors.level2;
      case 3:
        return Colors.level3;
      case 4:
        return Colors.level4;
      case 5:
        return Colors.level5;
      default:
        return Colors.darkGreen;
    }
  };


  const currentLevel = levels.find(({ min, max }) => currentPoints >= min && currentPoints <= max) ?? { level: 1, min: 0, max: 100 }; // Provide a default level
  const nextLevelPoints = currentLevel ? currentLevel.max + 1 : 0;

  const groupedTasks = tasks.reduce<Record<number, Task[]>>((acc, task) => {
    if (!acc[task.level]) acc[task.level] = [];
    acc[task.level].push(task);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>{i18n.t('myChallengeList.challenges')}</Text>

        <View
          style={[
            styles.levelButton,
            { backgroundColor: getColorForLevel(currentLevel.level) }
          ]}
        >
          <Text
            style={[
              styles.levelButtonText,
              { color: currentLevel.level === 2 ? 'black' : 'white' } // Dynamic text color
            ]}
          >
            {i18n.t('myChallengeList.level')} {currentLevel.level}
          </Text>
        </View>


        <Text style={styles.pointsText}>
          {currentPoints}/{nextLevelPoints}{' '}
          {i18n.t('myChallengeList.points_to_next_level')} {currentLevel.level + 1}
        </Text>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${((currentPoints - currentLevel.min) / (currentLevel.max - currentLevel.min + 1)) * 100
                  }%`, // Calculate level-specific progress
                backgroundColor: getColorForLevel(currentLevel.level), // Dynamic color
              },
            ]}
          />
        </View>



        {loading ? (
          <ActivityIndicator size="large" color={Colors.darkGreen} />
        ) : (
          levels
            .filter(({ level, min }) => currentPoints >= min || level === currentLevel.level + 1)
            .map(({ level, min, max }) => (
              <View key={level} style={styles.levelSection}>
                <View style={styles.levelHeaderContainer}>
                  <Text style={styles.levelHeader}>
                    {i18n.t('myChallengeList.level')} {level}
                  </Text>
                  {currentPoints < min && (
                    <Ionicons name="lock-closed" size={20} color={Colors.gray} />
                  )}
                </View>

                {groupedTasks[level]?.map((task, index) => (
                  currentPoints >= min && (
                    <TouchableOpacity
                      key={task.task_id || index}
                      onPress={() => handleTaskPress(task)}
                      style={styles.taskWrapper}
                    >
                      <View style={styles.taskItem}>
                        <View style={styles.taskIconContainer}>
                          <Ionicons
                            name={task.completed ? 'checkmark-circle' : 'trophy-outline'}
                            size={28}
                            color={task.completed ? 'green' : Colors.darkGreen}
                          />
                        </View>
                        <View style={styles.taskPointsContainer}>
                          <Text style={styles.taskPoints}>{task.task_points}</Text>
                          <Ionicons name="cash" size={20} color="gold" />
                        </View>
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskName}>{task.task_name}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => Alert.alert(task.task_name, task.task_description, [{ text: i18n.t('challenges.ok') }])}
                          style={styles.infoIconContainer}
                        >
                          <Ionicons name="information-circle-outline" size={24} color={Colors.darkGreen} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.separator} />
                    </TouchableOpacity>
                  )
                ))}
              </View>
            ))
        )}
      </ScrollView>

      {selectedTask && (
        <CameraModal
          visible={modalVisible}
          task={selectedTask}
          onClose={() => setModalVisible(false)}
          onComplete={(
            photo: { uri: string } | null,
            secondaryPhoto: { uri: string } | null,
            resetPhotos: () => void
          ) =>
            sendTaskCompletion(photo, secondaryPhoto, resetPhotos, () => setModalVisible(false))
          }
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
  scrollContainer: {
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  levelHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkGreen,
    marginRight: 5,
  },
  taskWrapper: {
    backgroundColor: '#fff',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  taskIconContainer: {
    marginRight: 10,
  },
  taskPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  taskDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoIconContainer: {
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginLeft: 55,
  },
  taskPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
    color: Colors.darkGreen,
  },
  progressBarContainer: {
    height: 10,
    width: '80%',
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.darkGreen,
  },
  levelButton: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});

export default MyChallenges;
