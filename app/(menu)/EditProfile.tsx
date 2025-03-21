import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { launchImageLibrary } from 'react-native-image-picker';
import Colors from '../../constants/Colors';
import { useRouter } from 'expo-router';
import i18n from '../../languages/i18n';
import InterestsModal from '../../components/Modals/InterestsModal';
import { API_URL } from '../../constants/constants';
import * as ImageManipulator from 'expo-image-manipulator';
import ProfilePlaceholder from '../../assets/profile.jpg';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';


const EditProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [interest1, setInterest1] = useState('');
  const [interest2, setInterest2] = useState('');
  const [interest3, setInterest3] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const router = useRouter();

  const interests = [
    { label: i18n.t('editProfilePage.fitness'), value: 'Fitness' },
    { label: i18n.t('editProfilePage.health'), value: 'Health' },
    { label: i18n.t('editProfilePage.exploring'), value: 'Exploring' },
    { label: i18n.t('editProfilePage.selfDevelopment'), value: 'Self-development' },
    { label: i18n.t('editProfilePage.relationshipsNetworking'), value: 'Relationships and Networking' },
    { label: i18n.t('editProfilePage.foodDrinks'), value: 'Food and Drinks' },
    { label: i18n.t('editProfilePage.entertainment'), value: 'Entertainment' },
    { label: i18n.t('editProfilePage.sports'), value: 'Sports' },
    { label: i18n.t('editProfilePage.nightout'), value: 'Nightout' },
    { label: i18n.t('editProfilePage.exploringCity'), value: 'Exploring the city' },
    { label: i18n.t('editProfilePage.seasonalActivities'), value: 'Seasonal activities' },
  ];
  
  useEffect(() => {
    fetchUser();
  }, []);
  
  const handleSignOut = () => {
    signOut(auth).catch(error => console.error('Sign-out error:', error));
  };

  const fetchUser = async () => {
    const currentUser = auth.currentUser || '' ;
    if (currentUser) {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/users/${currentUser.uid}`);
        const data = await response.json();
        setUser(data);
        setNewUsername(data.username);
  
        // Populate selectedInterests from interest1, interest2, and interest3
        const interestsFromBackend = [
          data.interest1 || '',
          data.interest2 || '',
          data.interest3 || '',
        ].filter(Boolean); // Remove any empty strings
        setSelectedInterests(interestsFromBackend);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser || '';
      if (!currentUser) {
        Alert.alert(i18n.t('editProfilePage.userNotAuthenticated'));
        return;
      }
  
      if (selectedInterests.length < 3) {
        Alert.alert('Error', 'You must select 3 interests.');
        return;
      }
  
      const response = await fetch(`http://${API_URL}:5001/api/users/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          interest1: selectedInterests[0],
          interest2: selectedInterests[1],
          interest3: selectedInterests[2],
        }),
      });
  
      if (response.ok) {
        router.push({
          pathname: '/(menu)/Profile',
          params: {
            timestamp: Date.now(),
          },
        });
        fetchUser();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || i18n.t('editProfilePage.errorUpdatingProfile'));
      }
    } catch (error) {
      console.error(i18n.t('editProfilePage.errorUpdatingProfile'), error);
      Alert.alert('Error', i18n.t('editProfilePage.errorUpdatingProfile'));
    }
  };
  

  const handleImagePick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
  
    if (result.didCancel) {
      return;
    }
  
    if (result.assets && result.assets[0].uri) {
      let pickedPhoto = result.assets[0];
  
      let actions = [];
      // Fix incorrect orientation in iOS
      if (pickedPhoto.width > pickedPhoto.height) {
        actions.push({ rotate: 90 });
      }
  
      actions.push({
        resize: {
          width: Math.min(pickedPhoto.width, pickedPhoto.height),
          height: Math.max(pickedPhoto.width, pickedPhoto.height),
        },
      });
  
      try {
        setLoading(true);
        
        // Process the image
        let processedImage = await ImageManipulator.manipulateAsync(
          pickedPhoto.uri,
          actions,
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );
  
        setSelectedImage(processedImage.uri);
  
        const currentUser = auth.currentUser || '';
  
        if (currentUser) {
          const uid = currentUser.uid;
          const fileName = result.assets[0].fileName || 'uploaded_image.jpg';
          const formData = new FormData();
  
          formData.append('file', {
            uri: processedImage.uri,
            type: result.assets[0].type,
            name: fileName,
          });
  
          formData.append('uid', uid);
  
          const token = await currentUser.getIdToken();
  
          const response = await fetch(
            `http://${API_URL}:5001/api/upload/profile-images`,
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
            router.push({
              pathname: '/(menu)/Profile',
              params: {
                timestamp: Date.now()
              },
            });
            fetchUser();
          } else {
            Alert.alert('Error', data.error || i18n.t('editProfilePage.errorUploadingImage'));
          }
        }
      } catch (error) {
        console.error(i18n.t('editProfilePage.errorUploadingImage'), error);
        Alert.alert('Error', i18n.t('editProfilePage.errorUploadingImage'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={{
              uri: user?.profile_image || selectedImage || ProfilePlaceholder,
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity onPress={handleImagePick} style={styles.penIconContainer}>
            <MaterialCommunityIcons name="pencil" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.titleText}>{i18n.t('editProfilePage.name')}</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={Colors.gray}
        value={newUsername}
        onChangeText={setNewUsername}
      />

      <Text style={styles.titleText}>{i18n.t('editProfilePage.interests')}</Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.modalButtonText}>
          {selectedInterests.length > 0
            ? selectedInterests
                .map((interest) => interests.find((item) => item.value === interest)?.label)
                .join(', ')
            : 'Select Your Interests'}
        </Text>
      </TouchableOpacity>


      <InterestsModal
        isVisible={isModalVisible}
        interests={interests}
        selectedInterests={selectedInterests}
        onSelectInterests={setSelectedInterests}
        onClose={() => setModalVisible(false)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{i18n.t('editProfilePage.save')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>{i18n.t('editProfilePage.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
  },
  profileImage: {
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
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.darkGreen,
    color: Colors.darkGreen,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    zIndex: 100,
    marginBottom: 20, // Add space between dropdowns
  },
  dropdownContainer: {
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    zIndex: 100,
  },
  dropdownText: {
    color: Colors.darkGreen,
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
  logoutButton: {
    padding: 15,
    backgroundColor: Colors.red,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
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
  
});


export default EditProfilePage;
