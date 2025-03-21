import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '../../context/GroupContext';
import i18n from "../../languages/i18n";
import { API_URL } from '../../constants/constants';
import { usePushNotifications } from "../../usePushNotifications";
import { getAuth } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';  // Ensure consistent Firebase instance


const MyGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChallengePackage, setLoadingChallengePackage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;
  const [challengePackage, setChallengePackage] = useState(null);
  const { timestamp } = useLocalSearchParams();
  const { expoPushToken, notification } = usePushNotifications(uid ?? "");

  const data = JSON.stringify(notification, undefined, 2);

  const getToken = async () => {
    try {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
        return null;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

  useEffect(() => {
    if (!currentUser) {
      router.replace('/(auth)/Login'); // Redirect to the login page if user is not authenticated
    }
  }, [currentUser]);


  useEffect(() => {
    getToken();
  }, []);

  const { setData } = useAppContext();

  const fetchChallengePackageByInterests = async (user) => {
    setLoadingChallengePackage(true);
    try {
      const response = await fetch(
        `http://${API_URL}:5001/api/challenge-packages/by-interests?interest1=${encodeURIComponent(user.interest1)}&interest2=${encodeURIComponent(user.interest2)}&interest3=${encodeURIComponent(user.interest3)}`
      );

      if (!response.ok) {
        throw new Error(i18n.t("myGroups.errorLoadingChallengePackage"));
      }

      const packageData = await response.json();
      setChallengePackage(packageData);
    } catch (error) {
      console.error('Error fetching challenge package by interests:', error);
      setError((error as Error).message);
    } finally {
      setLoadingChallengePackage(false);
    }
  };

  const fetchUser = async () => {
    if (currentUser) {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/users/${currentUser.uid}`);
        const data = await response.json();
        setUser(data);

        // Fetch challenge package after user data is fetched
        await fetchChallengePackageByInterests(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError(i18n.t("myGroups.errorLoadingUser"));
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, [currentUser]);

  const fetchGroups = async () => {


    if (!currentUser) {
      setError(i18n.t("myGroups.errorLoadingGroups"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://${API_URL}:5001/api/my-groups?auth_uid=${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(i18n.t("myGroups.errorLoadingGroups"));
      }

      const data = await response.json();
      setGroups(data);
      setError(null)
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(i18n.t("myGroups.errorLoadingGroups"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [timestamp, currentUser]);

  const renderGroupItem = ({ item }) => {
    const handleGroupPress = async () => {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/groups/${item.id}/members/${currentUser.uid}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(i18n.t("myGroups.errorLoadingGroups"));
        }

        const groupData = {
          groupId: item.id,
          authUid: item.auth_uid,
          groupName: item.group_name,
          groupDescription: item.description,
          groupImage: item.group_image,
          groupPackageId: item.group_challenge_package_id,
          groupEndDate: item.group_end_date,
          groupPrize: item.group_prize_id,
          groupPrizeText: item.group_prize_text,
          groupAdminId: item.group_admin_id,
          groupPin: item.group_pin,
          language: item.selected_language,
          walletId: item.wallet_id,
        };

        setData(groupData);

        router.push('/(menu)/(tabs)/GroupChat');
      } catch (error) {
        console.error('Error handling group press:', error);
      }
    };

    return (
      <TouchableOpacity style={styles.groupItem} onPress={handleGroupPress}>
        <Image source={{ uri: item.group_image || 'https://via.placeholder.com/50' }} style={styles.groupImage} />
        <View style={styles.groupDetails}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{item.group_name}</Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            <Text style={styles.lastMessageUsername}>{item.last_message?.username}: </Text>
            {item.last_message?.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
        <Text>{i18n.t("myGroups.loadingGroups")}</Text>
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
      {groups.length === 0 ? (
        loadingChallengePackage ? (
          <View style={styles.emptyContainer}>
            <Text>{i18n.t("myGroups.loadingChallengePackage")}</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: challengePackage?.package_image || 'https://via.placeholder.com/150' }}
              style={styles.image}
            />
            <Text style={styles.title}>{i18n.t("myGroups.noGroups")}</Text>
            <Text style={styles.description}>
              {i18n.t("myGroups.quickStartDescription", {
                packageName: challengePackage?.package_name || 'Challenge Package',
              })}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname: '/CreateGroup/EndAndPrize',
                  params: {
                    packageImage: challengePackage?.package_image,
                    packageId: challengePackage?.id,
                    groupName: `${challengePackage?.package_name || 'Group'} Group`,
                    language: 'en',
                  },
                })
              }
            >
              <Text style={styles.buttonText}>
                {i18n.t("myGroups.quickStartButton", {
                  packageName: challengePackage?.package_name || 'Challenge Package',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGroupItem}
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
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  groupDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.gray,
  },
  lastMessageUsername: {
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  groupDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MyGroupsPage;
