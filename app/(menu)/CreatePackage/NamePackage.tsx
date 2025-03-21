import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';
import * as Localization from 'expo-localization';

const NamePackagePage = () => {
  const [packageName, setPackageName] = useState('');
  const language = (Localization.locale || 'en').split('-')[0];
  const router = useRouter();

  const handleNext = () => {
    if (packageName) {
      router.push({
        pathname: '/(menu)/CreatePackage/Level1',
        params: { packageName, language },
      });
    } else {
      alert(i18n.t('namePackage.invalid_name_alert'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>{i18n.t('namePackage.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={i18n.t('namePackage.input_placeholder')}
            value={packageName}
            onChangeText={setPackageName}
          />
          <TouchableOpacity style={styles.buttonContainer} onPress={handleNext}>
            <Text style={styles.buttonText}>{i18n.t('namePackage.next')}</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
  buttonContainer: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NamePackagePage;
