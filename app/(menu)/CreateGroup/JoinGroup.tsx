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
import { API_URL } from '../../../constants/constants';
import { auth } from '../../../constants/firebaseConfig'; // Ensure consistent Firebase instance

const JoinGroup = () => {
  const [groupPin, setGroupPin] = useState('')
  const [loading, setLoading] = useState(false) // State for loading indicator
  const router = useRouter()

  const uid = auth.currentUser?.uid || '';

  const handleNext = async () => {
    if (!groupPin) {
      alert(i18n.t('joinGroup.invalid_pin_alert'))
      return
    }
  
    if (!uid) {
      alert(i18n.t('joinGroup.unauthenticated_alert'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`http://${API_URL}:5001/api/group-members-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          group_pin: groupPin,
          auth_uid: uid
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Navigate to another screen if necessary
        router.push({
          pathname: '/(menu)/JoinWallet',
          params: {
            walletId: data.wallet_id,
          },
        });
      } else {
        if (data.error === 'Group not found') {
          alert(i18n.t('joinGroup.group_not_found'))
        } else {
          alert(data.error || i18n.t('joinGroup.join_error'))
        }
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert(i18n.t('joinGroup.unknown_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>{i18n.t('joinGroup.enter_pin')}</Text>
          <TextInput
            style={styles.input}
            placeholder={i18n.t('joinGroup.group_pin')}
            value={groupPin}
            onChangeText={setGroupPin}
            keyboardType="numeric" // Set to number keyboard
          />
          <TouchableOpacity
            style={[styles.buttonContainer, loading && { backgroundColor: '#ccc' }]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? i18n.t('joinGroup.joining') : i18n.t('joinGroup.join')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
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

export default JoinGroup;