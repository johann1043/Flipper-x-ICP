import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';

const NewGroup = () => {
  const router = useRouter();

  const handleJoinGroup = () => {
    router.push('/(menu)/CreateGroup/JoinGroup'); // Adjust path as necessary
  };

  const handleCreateGroup = () => {
    router.push('/(menu)/CreateGroup/Name'); // Adjust path as necessary
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>{i18n.t('newGroup.title')}</Text>

          <TouchableOpacity style={styles.buttonContainer} onPress={handleJoinGroup}>
            <Text style={styles.buttonText}>{i18n.t('newGroup.joinWithPin')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonContainer} onPress={handleCreateGroup}>
            <Text style={styles.buttonText}>{i18n.t('newGroup.createNewGroup')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    backgroundColor: Colors.darkGreen, // Replace with your desired color
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: Colors.white, // Replace with your desired color
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NewGroup;
