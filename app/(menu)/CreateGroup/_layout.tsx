// (tabs)/CreateGroup/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import Colors from '../../../constants/Colors'; // Importing Colors
import i18n from '../../../languages/i18n';
import {  TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreateGroupLayout = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: Colors.darkGreen, // Applying darkGreen to all back buttons
      }}
    >
      <Stack.Screen name="NewGroup" options={{ title: i18n.t('createGroupLayout.newGroup'), headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={24} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ) }} />
      <Stack.Screen name="JoinGroup" options={{ title: i18n.t('createGroupLayout.joinGroup') }} />
      <Stack.Screen name="Name" options={{ title: i18n.t('createGroupLayout.name') }} />
      <Stack.Screen name="Package" options={{ title: i18n.t('createGroupLayout.package') }} />
      <Stack.Screen name="Challenges" options={{ title: i18n.t('createGroupLayout.challenges') }} />
      <Stack.Screen name="EndAndPrize" options={{ title: i18n.t('createGroupLayout.endAndPrize') }} />

    </Stack>
  );
};

export default CreateGroupLayout;
