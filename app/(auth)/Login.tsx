import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import Colors from '../../constants/Colors';
import { Link, useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import axios from 'axios';
import { API_URL, IOS_CLIENT_ID, ANDROID_CLIENT_ID, WEB_CLIENT_ID } from '../../constants/constants';
import i18n from '../../languages/i18n';

// Import Firebase Auth from the initialized app in layout.tsx
import { app } from '../../constants/firebaseConfig';  // <-- Ensure correct import path

const auth = getAuth(app);  // Use the same Firebase instance from layout.tsx

const Login = () => {
  const logo = require('../../assets/Logo.png');
  const googleLogo = require('../../assets/google_logo.png');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sign-in with Email & Password
  const handleSignin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(menu)'); // Redirect to the main menu after login
    } catch (error) {
      console.error("Login Error:", error);
      alert(i18n.t('loginScreen.loginError'));
    } finally {
      setLoading(false);
    }
  };

  // Google Authentication
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { authentication } = response;
      if (!authentication?.idToken) {
        setLoading(false);
        return;
      }

      const credential = GoogleAuthProvider.credential(authentication.idToken);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const { uid, email, displayName } = userCredential.user;

          try {
            // Check if the user exists in the database
            const userResponse = await fetch(`http://${API_URL}:5001/api/users/${uid}`);
            const userData = await userResponse.json();

            if (userResponse.ok && userData) {
              router.replace('/(menu)'); // If user exists, redirect to menu
            } else {
              // Create a new user in the database
              await axios.post(
                `http://${API_URL}:5001/api/users`,
                {
                  uid,
                  username: displayName || '',
                  profile_image: '',
                  device_id: '',
                  email,
                },
                { headers: { 'Content-Type': 'application/json' } }
              );

              // Redirect to User Interests page after sign-up
              router.replace('/(menu)/UserInformation/UserInterests');
            }
          } catch (error) {
            console.error('Error checking/creating user:', error);
            alert('Error signing up with Google. Please try again.');
          }
        })
        .catch((error) => {
          console.error('Firebase Auth Error:', error);
          alert('Google signup failed. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [response]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container} >
        <Image source={logo} style={styles.logo} />
        <Text style={styles.headline}>Flipper</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.white} />
        ) : (
          <>
            <KeyboardAvoidingView
              style={styles.KeyboardAvoidingContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <TextInput
                style={styles.input}
                placeholder={i18n.t('loginScreen.email')}
                placeholderTextColor={Colors.white}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder={i18n.t('loginScreen.password')}
                placeholderTextColor={Colors.white}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

            </KeyboardAvoidingView>

            <TouchableOpacity onPress={() => router.push('/ForgotPassword')}>
              <Text style={styles.description}>
                <Text style={styles.link}>{i18n.t('loginScreen.forgot_password')}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleSignin}>
              <Text style={styles.buttonText}>{i18n.t('loginScreen.login')}</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>{i18n.t('loginScreen.or')}</Text>

            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
              <Image source={googleLogo} style={styles.googleLogo} />
              <Text style={styles.googleButtonText}>{i18n.t('loginScreen.login_google')}</Text>
            </TouchableOpacity>

            <Link href={'/Signup'} asChild>
              <TouchableOpacity>
                <Text style={styles.description}>
                  {i18n.t('loginScreen.no_account')}{' '}
                  <Text style={styles.link}>{i18n.t('loginScreen.sign_up')}</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2B2B2B',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    color: Colors.white,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#1F1F1F',
    borderRadius: 5,
    color: Colors.white,
  },
  KeyboardAvoidingContainer: {
    width: '100%',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    margin: 20,
    color: Colors.white,
  },
  link: {
    color: Colors.green,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Colors.darkGreen,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '500',
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DADCE0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2, // For Android shadow
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#5F6368',
    fontSize: 16,
    fontWeight: '500',
  },
  orText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default Login;