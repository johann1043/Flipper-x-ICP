import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';

const UserInformationLayout = () => {
  const router = useRouter();
  const timestamp = Date.now();

  return (
    <Stack>
      <Stack.Screen
        name="UserInterests"
        options={{
          title: i18n.t('userInformationLayout.selectInterests'),
          headerStyle: {
            backgroundColor: '#2B2B2B', // Match screen background color
          },
          headerTintColor: Colors.white, // Ensure text is visible
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.replace({ 
                pathname: '/(menu)', 
                params: { timestamp: timestamp.toString() } 
              })}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>{i18n.t('userInformationLayout.skip')}</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

const styles = StyleSheet.create({
  skipButton: {
    marginRight: 15,
  },
  skipButtonText: {
    color: Colors.white,
    fontSize: 16,
  },
});

export default UserInformationLayout;
