import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import Colors from '../../constants/Colors';
import { useRouter } from 'expo-router';
import i18n from '../../languages/i18n';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig';  // Import the initialized Firebase instance


const ForgotPassword = () => {
  const logo = require('../../assets/Logo.png');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(i18n.t('forgotPasswordScreen.error'), i18n.t('forgotPasswordScreen.enter_email'));
      return;
    }
  
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(i18n.t('forgotPasswordScreen.success'), i18n.t('forgotPasswordScreen.check_email'));
      router.replace('/Login');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(i18n.t('forgotPasswordScreen.error'), error.message);
      } else {
        Alert.alert(i18n.t('forgotPasswordScreen.error'), 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };  

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.headline}>{i18n.t('forgotPasswordScreen.title')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.white} />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={i18n.t('forgotPasswordScreen.enter_email')}
              placeholderTextColor={Colors.white}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <Text style={styles.buttonText}>{i18n.t('forgotPasswordScreen.reset_password')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/Login')}>
              <Text style={styles.description}>
                <Text style={styles.link}>{i18n.t('forgotPasswordScreen.back_to_login')}</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  ...StyleSheet.flatten({
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20, 
      backgroundColor: '#2B2B2B' 
    },
    logo: { 
      width: 100, 
      height: 100, 
      marginBottom: 40,
    },
    headline: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: Colors.white,
      margin: 40,
    },
    input: { 
      width: '100%', 
      padding: 15, 
      backgroundColor: '#1F1F1F', 
      borderRadius: 5, 
      color: Colors.white, 
      marginVertical: 10,
      marginBottom: 20, 
    },
    button: { 
      width: '100%', 
      alignItems: 'center', 
      padding: 15, 
      backgroundColor: Colors.darkGreen, 
      borderRadius: 5,
      margin: 10, 
    },
    buttonText: { 
      color: Colors.white, 
      fontSize: 18, 
      fontWeight: '500' 
    },
    description: { 
      fontSize: 14, 
      textAlign: 'center', 
      margin: 20, 
      color: Colors.white 
    },
    link: { 
      color: Colors.green, 
      fontWeight: 'bold' 
    }
  }),
});

export default ForgotPassword;
