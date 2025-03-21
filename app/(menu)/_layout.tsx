import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import i18n from '../../languages/i18n';
import { useAppContext } from '../../context/GroupContext';
import { API_URL } from '../../constants/constants';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';


export default function MenuLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logedinUser, setLogedinUser] = useState(null);
  const router = useRouter();
  const segments = useSegments();

  const { data } = useAppContext();

  const fetchUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/users/${currentUser.uid}`);
        const data = await response.json();
        setLogedinUser(data)
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/Login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors.darkGreen,
        headerShown: route.name === 'index',
        headerRight: () =>
          route.name === 'index' ? (
            <TouchableOpacity onPress={() => router.push('/(menu)/CreateGroup/NewGroup')}>
              <Ionicons name="add" size={30} style={{ marginRight: 10 }} />
            </TouchableOpacity>
          ) : null,
      })}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: i18n.t('menuLayoutScreen.myGroups'),
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="MyChallenges"
        options={{
          headerShown: true,
          title: i18n.t('menuLayoutScreen.myChallenges'),
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
          headerRight: () =>
            <TouchableOpacity onPress={() => router.push('/(menu)/CreatePackage/NamePackage')}>
              <Ionicons name="add" size={30} style={{ marginRight: 10 }} />
            </TouchableOpacity>
        }}
      />


      <Tabs.Screen
        name="Contact"
        options={{
          headerShown: true,
          title: i18n.t('menuLayoutScreen.feedback'),
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          headerShown: true,
          title: i18n.t('menuLayoutScreen.profile'),
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 10 }}
              onPress={() =>
                router.push('/(menu)/EditProfile')
              }
            >
              <Ionicons name="create-outline" size={24} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="(tabs)"
        options={{
          headerShown: true,
          href: null, // Exclude from bottom tabs
          title: data?.groupName || i18n.t('menuLayoutScreen.groupDetails'), // Dynamic group name
          tabBarStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(menu)',
                  params: {
                    timestamp: Date.now(),
                  },
                })
              }
            >
              <Ionicons
                name="chevron-back-outline"
                size={24}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(menu)/GroupDetails',
                  params: {
                    groupId: data?.groupId,
                    language: data?.language
                  },
                })
              }
              style={{
                marginRight: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={{
                  uri: data?.groupImage || 'https://via.placeholder.com/150',
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 20, // Makes it round
                }}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="CreateGroup"
        options={{
          href: null, // Exclude from bottom tabs
          title: i18n.t('menuLayoutScreen.joinGroup'),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="CreatePackage"
        options={{
          href: null, // Exclude from bottom tabs
          title: i18n.t('menuLayoutScreen.namePackage'),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="FeedChat"
        options={{
          headerShown: true,
          href: null, // Exclude from bottom tabs
          title: i18n.t('menuLayoutScreen.giveFeedback'),
          tabBarStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(menu)/Contact')}>
              <Ionicons name="chevron-back-outline" size={24} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          )
        }}
      />

      <Tabs.Screen
        name="UserInformation"
        options={{
          href: null, // Exclude from bottom tabs
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="GroupDetails"
        options={{
          href: null, // Exclude from bottom tabs
          headerShown: true,
          title: i18n.t('menuLayoutScreen.groupDetails'),
          tabBarStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(menu)/(tabs)/GroupChat')}>
              <Ionicons
                name="chevron-back-outline"
                size={24}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
          headerRight: () =>
            user?.uid === data?.authUid ? ( // Conditional rendering
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(menu)/EditGroup',
                    params: {
                      groupId: data?.groupId,
                      language: data?.language,
                    },
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={24}
                  style={{ marginRight: 10 }}
                />
              </TouchableOpacity>
            ) : null, // No button if condition fails
        }}
      />

      <Tabs.Screen
        name="EditGroup"
        options={{
          href: null, // Exclude from bottom tabs
          headerShown: true,
          title: i18n.t('menuLayoutScreen.editGroup'),
          tabBarStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(menu)/GroupDetails',
                  params: {
                    groupId: data?.groupId,
                    language: data?.language
                  },
                })
              }
            >
              <Ionicons
                name="chevron-back-outline"
                size={24}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="EditProfile"
        options={{
          href: null, // Exclude from bottom tabs
          headerShown: true,
          title: i18n.t('menuLayoutScreen.editProfile'),
          tabBarStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(menu)/Profile')}>
              <Ionicons
                name="chevron-back-outline"
                size={24}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="JoinWallet"
        options={{
          href: null, // Exclude from bottom tabs
          headerShown: true,
          title: 'Join Group Wallet',
          tabBarStyle: { display: 'none' },
        }}
      />

    </Tabs>
  );

}

