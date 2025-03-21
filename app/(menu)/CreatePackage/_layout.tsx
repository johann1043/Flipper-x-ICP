// (tabs)/CreateGroup/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import Colors from '../../../constants/Colors'; // Importing Colors
import i18n from '../../../languages/i18n';
import {  TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreatePackageLayout = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: Colors.darkGreen, // Applying darkGreen to all back buttons
      }}
    >
      <Stack.Screen
        name="NamePackage"
        options={{
          title: i18n.t('createPackageLayout.nameYourPackage'),
            headerLeft: () => (
            <TouchableOpacity onPress={() => router.push('/(menu)/MyChallenges')}>
                <Ionicons name="chevron-back-outline" size={24} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
            ),
        }}
      />

      <Stack.Screen name="Level1" options={{ title: i18n.t('createPackageLayout.level1Challenges')}} />
      <Stack.Screen name="Level2" options={{ title: i18n.t('createPackageLayout.level2Challenges')}} />
      <Stack.Screen name="Level3" options={{ title: i18n.t('createPackageLayout.level3Challenges')}} />
      <Stack.Screen name="Level4" options={{ title: i18n.t('createPackageLayout.level4Challenges')}} />
      <Stack.Screen name="Level5" options={{ title: i18n.t('createPackageLayout.level5Challenges')}} />

    </Stack>
  );
};

export default CreatePackageLayout;
