import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../constants/Colors';
import { useLocalSearchParams } from 'expo-router';
import i18n from "../../languages/i18n";
import { API_URL } from '../../constants/constants';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig'; // Ensure consistent Firebase instance

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { timestamp } = useLocalSearchParams();

  const handleSignOut = () => {
    signOut(auth).catch(error => console.error('Sign-out error:', error));
  };

  const fetchUser = async () => {
    const currentUser = auth.currentUser || '';
    if (currentUser) {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/users/${currentUser.uid}`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchUser();
  }, [timestamp]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{i18n.t('profilePage.loading')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{i18n.t('profilePage.errorFetchingData')}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutButtonText}>{i18n.t('profilePage.logout')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={{
              uri: user?.profile_image || 'https://via.placeholder.com/150',
            }}
            style={styles.profileImage}
          />
        </View>
      </View>

      {/* Username */}
      <View style={styles.infoSection}>
        <Text style={styles.titleText}>{i18n.t('profilePage.name')}</Text>
        <Text style={styles.infoText}>{user.username || i18n.t('profilePage.noNameProvided')}</Text>
      </View>

      {/* Interests */}
      <View style={styles.infoSection}>
        <Text style={styles.titleText}>{i18n.t('profilePage.myInterests')}</Text>
        <Text style={styles.infoText}>
          {user.interest1 || i18n.t('profilePage.notSpecified')}
        </Text>
        <Text style={styles.infoText}>
          {user.interest2 || i18n.t('profilePage.notSpecified')}
        </Text>
        <Text style={styles.infoText}>
          {user.interest3 || i18n.t('profilePage.notSpecified')}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>{i18n.t('profilePage.logout')}</Text>
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
    borderWidth: 2,
    borderColor: Colors.darkGreen,
  },
  infoSection: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.darkGreen,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    marginBottom: 30,
  },
});

export default ProfilePage;
