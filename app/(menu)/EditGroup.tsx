import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  SectionList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import Colors from '../../constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { GroupData, useAppContext } from '../../context/GroupContext';
import i18n from '../../languages/i18n';
import PrizeModal from '../../components/Modals/PrizeModal';
import LanguageDropdownModal from '../../components/Modals/LanguageDropdownModal';
import { API_URL } from '../../constants/constants';
import * as ImageManipulator from 'expo-image-manipulator';
import { Member, Prize } from '../../context/Types';


const EditGroupPage = () => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [date, setDate] = useState(dayjs());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [language, setLanguage] = useState('en'); // Default to current language or 'en'
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
  const [items, setItems] = useState([
    { label: 'English 🇺🇸', value: 'en' },
    { label: 'German 🇩🇪', value: 'de' },
  ]);
  const router = useRouter();

  console.log(members[0])

  const { setData } = useAppContext();

  const { data } = useAppContext()

  const { groupId } = useLocalSearchParams();

  useEffect(() => {
    if (data?.groupMembers) {
      setMembers(data.groupMembers);
      setMembersLoading(false); // Fix the loading state
    } else {
      setMembersLoading(false); // Handle when groupMembers is unavailable
    }
  }, [data?.groupMembers]);
  
  useEffect(() => {
    if (data) {
      setGroup(data);
      setLoading(false); // Ensure the loading state is updated
  
      // Set default values for prize and end date
      setSelectedPrize(data.groupPrize || null);
      setDate(data.groupEndDate ? dayjs(data.groupEndDate) : dayjs());
      setNewGroupName(data.groupName)
      setNewGroupDescription(data.groupDescription)
      setLanguage(data.language)
    }
  }, [data]);
  

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/prizes?language=${language}`);
        const data = await response.json();
        const prizeItems = data.map((prize: Prize) => ({
          label: prize.prize_text,
          value: prize.id,
        }));
        setPrizes(prizeItems);
      } catch (error) {
        console.error(i18n.t('editGroupPage.fetchPrizesError'), error);
      }
    };
    fetchPrizes();
  }, [language]);

  const handleSave = async () => {
    try {
      // Find the selected prize text from the `prizes` state
      const selectedPrizeText = prizes.find((prize) => prize.value === selectedPrize)?.label;

      // Gather the updated group data
      const updatedGroupData = {
        groupName: newGroupName || group?.groupName,
        groupDescription: newGroupDescription || group?.groupDescription,
        groupEndDate: date.format(),
        groupPrize: selectedPrize,
        groupPrizeText: selectedPrizeText, // Add the prize text
        language, // Include the selected language
      };

      const response = await fetch(`http://${API_URL}:5001/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGroupData),
      });

      if (response.ok) {
        // Update global data using setData
        setData((prevData) => ({
          ...prevData,
          ...updatedGroupData,
        }));

        router.push('/(menu)/(tabs)/GroupChat');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || i18n.t('editGroupPage.updateGroupError'));
      }
    } catch (error) {
      console.error(i18n.t('editGroupPage.updateGroupError'), error);
      Alert.alert('Error', i18n.t('editGroupPage.updateGroupError'));
    }
  };
  
  

  const handleImagePick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
  
    if (result.didCancel) return;
  
    if (result.assets && result.assets[0].uri) {
      let pickedPhoto = result.assets[0];
  
      let actions = [];
      // Fix incorrect orientation in iOS
      if (pickedPhoto.width !== undefined && pickedPhoto.height !== undefined) {
        if (pickedPhoto.width > pickedPhoto.height) {
            actions.push({ rotate: 90 });
        }
    
        actions.push({
            resize: {
                width: Math.min(pickedPhoto.width, pickedPhoto.height),
                height: Math.max(pickedPhoto.width, pickedPhoto.height),
            },
        });
    } else {
        console.error("Picked photo is missing width or height.");
    }
    
  
      try {
        setLoading(true);
  
        // Process the image
        let processedImage = await ImageManipulator.manipulateAsync(
          pickedPhoto.uri,
          actions,
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
  
        setSelectedImage(processedImage.uri);
  
        const fileName = result.assets[0].fileName || 'group_image.jpg';
        const formData = new FormData();
  
        formData.append('file', {
          uri: processedImage.uri,
          type: result.assets[0].type,
          name: fileName,
        });
  
        formData.append('groupId', groupId);
  
        const response = await fetch(
          `http://${API_URL}:5001/api/upload/group-images`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          }
        );
  
        const data = await response.json();
  
        if (response.ok) {
          const updatedGroup = { ...group, groupImage: data.signedUrl }; // Updated with the new image URL
          setGroup(updatedGroup);
          setData((prevData) => ({
            ...prevData,
            ...updatedGroup, // Use updatedGroup instead of updatedGroupData
          }));
  
          router.push('/(menu)/GroupDetails');
        } else {
          Alert.alert(i18n.t('editGroupPage.error'), data.error || i18n.t('editGroupPage.uploadFailed'));
        }
      } catch (error) {
        console.error(i18n.t('editGroupPage.uploadFailed'), error);
        Alert.alert('Error', i18n.t('editGroupPage.uploadFailed'));
      } finally {
        setLoading(false);
      }
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <Text>{i18n.t('editGroupPage.loading')}</Text>
      </View>
    );
  }

  const handleDeleteMember = async (memberId, groupId) => {
    Alert.alert(
      i18n.t('editGroupPage.removeMember'),
      i18n.t('editGroupPage.removeMemberConfirmation'),
      [
        { text: i18n.t('editGroupPage.cancel'), style: 'cancel' },
        {
          text: i18n.t('editGroupPage.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://${API_URL}:5001/api/group-members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId }), // Include groupId here
              });
  
              if (response.ok) {
                // Update triggerRefresh in context
                setData((prev) => ({
                  ...prev,
                  triggerRefresh: Date.now(), // Toggle triggerRefresh
                }));
                router.push({
                  pathname: '/(menu)/GroupDetails',
                  params: {
                    timestamp: Date.now(),
                  },
                });
                setMembers((prevMembers) =>
                  prevMembers.filter((member) => member.group_member_id !== memberId)
                );
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || i18n.t('editGroupPage.removeMemberError'));
              }
            } catch (error) {
              console.error(i18n.t('editGroupPage.removeMemberError'), error);
              Alert.alert('Error', i18n.t('editGroupPage.removeMemberError'));
            }
          },
        },
      ]
    );
  };
  
  
  const handleDeleteGroup = async () => {
    Alert.alert(
      i18n.t('editGroupPage.deleteGroup'),
      i18n.t('editGroupPage.deleteGroupConfirmation'),
      [
        { text: i18n.t('editGroupPage.cancel'), style: 'cancel' },
        {
          text: i18n.t('editGroupPage.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://${API_URL}:5001/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
  
              if (response.ok) {
                router.push({
                  pathname: '/(menu)',
                  params: {
                    timestamp: Date.now()
                  },
                });
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.error || i18n.t('editGroupPage.deleteGroupError'));
              }
            } catch (error) {
              console.error(i18n.t('editGroupPage.deleteGroupError'), error);
              Alert.alert('Error', i18n.t('editGroupPage.deleteGroupError'));
            }
          },
        },
      ]
    );
  };
  

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <SectionList
        sections={[
          {
            title: 'Group Details',
            data: [
              {
                key: 'groupImageSection',
                component: (
                  <View style={styles.groupImageContainer}>
                    <View style={styles.groupImageWrapper}>
                      <Image
                        source={{
                          uri: selectedImage || group?.groupImage || 'https://via.placeholder.com/150',
                        }}
                        style={styles.groupImage}
                      />
                      <TouchableOpacity onPress={handleImagePick} style={styles.penIconContainer}>
                        <MaterialCommunityIcons name="pencil" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ),
              },
              {
                key: 'languageSection',
                component: (
                  <>
                    <Text style={styles.titleText}>
                      {i18n.t('editGroupPage.selectLanguage')}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setLanguageModalVisible(true)}
                    >
                      <Text style={styles.modalButtonText}>
                        {items.find((item) => item.value === language)?.label ||
                          i18n.t('editGroupPage.selectLanguage')}
                      </Text>
                    </TouchableOpacity>
                    <LanguageDropdownModal
                      isVisible={isLanguageModalVisible}
                      languages={items}
                      selectedLanguage={language}
                      onSelectLanguage={(value: string) => setLanguage(value)}
                      onClose={() => setLanguageModalVisible(false)}
                    />
                  </>
                ),
              },
              {
                key: 'groupNameSection',
                component: (
                  <TextInput
                    style={styles.input}
                    placeholder={group?.groupName || i18n.t('editGroupPage.groupNamePlaceholder')}
                    placeholderTextColor={Colors.darkGreen}
                    value={newGroupName}
                    onChangeText={(text) => setNewGroupName(text)}
                  />
                ),
              },
              {
                key: 'groupDescriptionSection',
                component: (
                  <TextInput
                    style={styles.input}
                    placeholder={
                      group?.groupDescription ||
                      i18n.t('editGroupPage.groupDescriptionPlaceholder')
                    }
                    placeholderTextColor={Colors.darkGreen}
                    value={newGroupDescription}
                    onChangeText={(text) => setNewGroupDescription(text)}
                  />
                ),
              },
              {
                key: 'selectPrizeSection',
                component: (
                  <>
                    <Text style={styles.titleText}>{i18n.t('editGroupPage.selectPrize')}</Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setModalVisible(true)}
                    >
                      <Text style={styles.modalButtonText}>
                        {selectedPrize
                          ? prizes.find((prize) => prize.value === selectedPrize)?.label
                          : i18n.t('editGroupPage.selectPrize')}
                      </Text>
                    </TouchableOpacity>
                    <PrizeModal
                      isVisible={isModalVisible}
                      prizes={prizes}
                      selectedPrize={selectedPrize}
                      onSelectPrize={setSelectedPrize}
                      onClose={() => setModalVisible(false)}
                    />
                  </>
                ),
              },
              {
                key: 'endDateSection',
                component: (
                  <>
                    <Text style={styles.titleText}>{i18n.t('editGroupPage.endDate')}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setDatePickerVisible(true)}
                    >
                      <Text style={styles.dateButtonText}>{date.format('DD MMM YYYY')}</Text>
                    </TouchableOpacity>
                    {isDatePickerVisible && (
                      <View style={styles.datePickerContainer}>
                        <DateTimePicker
                          mode="single"
                          date={date.toDate()}
                          onChange={({ date }) => {
                            if (dayjs(date).isAfter(dayjs())) {
                              setDate(dayjs(date));
                            } else {
                              Alert.alert(
                                i18n.t('editGroupPage.invalidDate'),
                                i18n.t('editGroupPage.invalidDateMessage')
                              );
                            }
                            setDatePickerVisible(false);
                          }}
                        />
                      </View>
                    )}
                  </>
                ),
              },
              {
                key: 'saveButtonSection',
                component: (
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>
                      {i18n.t('editGroupPage.save')}
                    </Text>
                  </TouchableOpacity>
                ),
              },
            ],
          },
          {
            title: 'Group Members',
            data: [
              {
                key: 'membersSection',
                component: membersLoading ? (
                  <ActivityIndicator size="small" color={Colors.darkGreen} />
                ) : (
                  members.map((item) => (
                    <View style={styles.memberRow} key={item.group_member_id.toString()}>
                      <View style={styles.memberInfo}>
                        <Image source={{ uri: item.profile_image }} style={styles.memberImage} />
                        <Text style={styles.memberUsername}>{item.username}</Text>
                      </View>
                      {item.auth_uid === group?.authUid ? (
                        <Text style={styles.adminText}>
                          {i18n.t('editGroupPage.admin')}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleDeleteMember(item.group_member_id, groupId)}
                        >
                          <MaterialCommunityIcons name="trash-can" size={24} color="red" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ),
              },
              {
                key: 'deleteGroupButtonSection',
                component: (
                  <TouchableOpacity
                    style={styles.deleteGroupButton}
                    onPress={handleDeleteGroup}
                  >
                    <Text style={styles.deleteGroupButtonText}>
                      {i18n.t('editGroupPage.deleteGroup')}
                    </Text>
                  </TouchableOpacity>
                ),
              },
            ],
          },
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => item.component}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.scrollContainer}
      />
    </KeyboardAvoidingView>
  );  
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  groupImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  groupImageWrapper: {
    width: 150,
    height: 150,
  },
  groupImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  penIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.darkGreen,
    padding: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    borderRadius: 5,
    color: Colors.darkGreen,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownContainer: {
    zIndex: 1000,
  },
  dateButton: {
    padding: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGreen,
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  saveButton: {
    padding: 15,
    backgroundColor: Colors.darkGreen,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersSection: {
    marginTop: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between', // Ensures delete icon moves to the right
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ensures the name and image take the available space
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberUsername: {
    fontSize: 16,
    color: Colors.gray,
  },
  adminText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGreen,
  },
  deleteGroupButton: {
    padding: 15,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteGroupButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },  
  modalButton: {
    padding: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalButtonText: {
    fontSize: 16,
    color: Colors.darkGreen,
  }, 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold', 
    marginBottom: 10,
  },
  // modalButton: {
  //   padding: 15,
  //   backgroundColor: Colors.white,
  //   borderColor: Colors.darkGreen,
  //   borderWidth: 1,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   marginBottom: 20,
  // },
  // modalButtonText: {
  //   fontSize: 16,
  //   color: Colors.darkGreen,
  // },   
});

export default EditGroupPage;
