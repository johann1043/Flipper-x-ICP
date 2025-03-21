import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import Colors from '../../constants/Colors';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { debounce } from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../languages/i18n';
import * as Google from 'expo-auth-session/providers/google';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseError } from "firebase/app";
import { auth } from '../../constants/firebaseConfig';
import { API_URL, IOS_CLIENT_ID, ANDROID_CLIENT_ID, WEB_CLIENT_ID } from '../../constants/constants';

const Signup = () => {
    const logo = require('../../assets/Logo.png');
    const googleLogo = require('../../assets/google_logo.png');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [loading, setLoading] = useState(false);
    const [doPasswordsMatch, setDoPasswordsMatch] = useState<boolean | null>(null);
    const router = useRouter();
    const [visible, setVisible] = useState(true);

    // Debounced password match check
    const debouncedCheckPasswords = useCallback(
        debounce((password, confirmPassword) => {
            if (confirmPassword === '') {
                setDoPasswordsMatch(null);
                return;
            }

            if (password === confirmPassword) {
                setDoPasswordsMatch(true);
            } else {
                setDoPasswordsMatch(false);
            }
        }, 800),
        []
    );

    useEffect(() => {
        debouncedCheckPasswords(password, confirmPassword);
    }, [confirmPassword]);

    const validateEmail = (email: string) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleSignup = async () => {
        if (!validateEmail(email)) {
            alert(i18n.t("signupScreen.emailFormat"));
            return;
        }

        if (!firstName.trim()) {
            alert(i18n.t("signupScreen.firstNameRequired"));
            return;
        }

        if (!doPasswordsMatch) {
            alert(i18n.t("signupScreen.passwordMatch"));
            return;
        }

        setLoading(true);
        try {
            // Create user with Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { uid } = userCredential.user;

            // Create user in PostgreSQL with first name (as username) and email
            await axios.post(
                `http://${API_URL}:5001/api/users`,
                {
                    uid,
                    username: firstName, // Use firstName as username
                    profile_image: "", // Empty profile image
                    device_id: "", // Empty device ID
                    email, // Pass email
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            router.replace("/(menu)/UserInformation/UserInterests");
        } catch (error) {
            if (error instanceof FirebaseError) {
                if (error.code === "auth/email-already-in-use") {
                    alert(i18n.t("signupScreen.emailExists"));
                } else if (error.code === "auth/weak-password") {
                    alert(i18n.t("signupScreen.weakPassword"));
                } else {
                    console.error("Sign up failed:", error);
                    alert(i18n.t("signupScreen.signupFail"));
                }
            } else {
                console.error("Unexpected error:", error);
                alert(i18n.t("signupScreen.signupFail"));
            }
        } finally {
            setLoading(false);
        }
    };


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
                        const userResponse = await fetch(`http://${API_URL}:5001/api/users/${uid}`);
                        const userData = await userResponse.json();

                        if (userResponse.ok && userData) {
                            router.replace('/(menu)');
                        } else {
                            await axios.post(
                                `http://${API_URL}:5001/api/users`,
                                {
                                    uid,
                                    username: displayName || '',
                                    profile_image: '',
                                    device_id: '',
                                    email,
                                },
                                {
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                }
                            );
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

    {
        loading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.white} />
            </View>
        )
    }


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.headline}>Flipper</Text>

                <KeyboardAvoidingView
                    style={styles.formContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >


                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.white} />
                    ) : visible ? (

                        <>
                            <TouchableOpacity style={styles.button} onPress={() => setVisible(false)}>
                                <Text style={styles.buttonText}>{i18n.t('signupScreen.email_sign_up')}</Text>
                            </TouchableOpacity>

                            <Text style={styles.orText}>{i18n.t('signupScreen.or')}</Text>

                            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
                                <Image source={googleLogo} style={styles.googleLogo} />
                                <Text style={styles.googleButtonText}>{i18n.t('signupScreen.sign_up_google')}</Text>
                            </TouchableOpacity>
                        </>

                    ) : (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t('signupScreen.first_name')}
                                placeholderTextColor={Colors.white}
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t('signupScreen.email')}
                                placeholderTextColor={Colors.white}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t('signupScreen.password')}
                                placeholderTextColor={Colors.white}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder={i18n.t('signupScreen.confirm_password')}
                                placeholderTextColor={Colors.white}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                            {doPasswordsMatch === false && (
                                <Text style={styles.errorText}>
                                    <Ionicons name="close-circle" color={Colors.red} /> {i18n.t('signupScreen.passwordMatch')}
                                </Text>
                            )}
                            {doPasswordsMatch === true && (
                                <Text style={styles.successText}>
                                    <Ionicons name="checkmark-circle" color={Colors.green} /> {i18n.t('signupScreen.matchingPasswords')}
                                </Text>
                            )}
                            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                                <Text style={styles.buttonText}>{i18n.t('signupScreen.sign_up')}</Text>
                            </TouchableOpacity>

                            <Text style={styles.orText}>{i18n.t('signupScreen.or')}</Text>

                            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
                                <Image source={googleLogo} style={styles.googleLogo} />
                                <Text style={styles.googleButtonText}>{i18n.t('signupScreen.sign_up_google')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                </KeyboardAvoidingView>
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
    errorText: {
        color: Colors.red,
        marginBottom: 10,
    },
    successText: {
        color: Colors.green,
        marginBottom: 10,
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
    loadingOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orText: {
        color: 'white',
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 10,
    },
});

export default Signup;
