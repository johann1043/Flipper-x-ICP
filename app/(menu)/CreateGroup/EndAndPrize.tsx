import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import Colors from '../../../constants/Colors';
import { auth } from '../../../constants/firebaseConfig'; // Ensure consistent Firebase instance
import i18n from '../../../languages/i18n';
import { API_URL } from '../../../constants/constants';
import PrizeModal from '../../../components/Modals/PrizeModal';
import { Prize } from '../../../context/Types';
import * as Linking from 'expo-linking';

const EndAndPrize = () => {
  const router = useRouter();
  const [date, setDate] = useState(dayjs());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const uid = auth.currentUser?.uid || '';
  const { packageId, groupName, language } = useLocalSearchParams();
  const [isPrizeModalVisible, setPrizeModalVisible] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [isWalletInputVisible, setWalletInputVisible] = useState(false);

  console.log(selectedPrize)


  const formattedDate = date.format('DD MMM YYYY');

  // Fetch prizes based on language
  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch(`http://${API_URL}:5001/api/prizes?language=${language}`);
        const data = await response.json();

        const prizeItems = data.map((prize: Prize) => ({
          label: prize.prize_text,
          value: prize.id,  // Store the prize ID as the value
        }));
        setPrizes(prizeItems);
      } catch (error) {
        console.error(i18n.t('endAndPrize.error_fetching_prizes'), error);
      }
    };

    fetchPrizes();
  }, [language]);

  // Handle Date Picker logic
  const toggleDatePicker = () => {
    setPickerVisible(!isPickerVisible);
  };

  const handleDateChange = (params: any) => {
    if (params?.date) {
      const selectedDate = dayjs(params.date);
      if (selectedDate.isAfter(dayjs(), 'day')) {
        setDate(selectedDate.clone());
        setPickerVisible(false);
      } else {
        Alert.alert(
          i18n.t('endAndPrize.invalid_date_alert_title'),
          i18n.t('endAndPrize.invalid_date_alert_message')
        );
      }
    }
  };

  // Handle prize selection and form submission
  const handleCreate = async () => {
    if (!selectedPrize || date.isSame(dayjs(), 'day') || date.isBefore(dayjs(), 'day')) {
      Alert.alert(
        i18n.t('endAndPrize.missing_info_alert_title'),
        i18n.t('endAndPrize.missing_info_alert_message')
      );
      return;
    }
  
    try {
      const formattedLocalDate = date.format();
  
      const response = await fetch(`http://${API_URL}:5001/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_uid: uid,
          group_challenge_package_id: packageId,
          group_name: groupName,
          group_prize: selectedPrize,
          group_end_date: formattedLocalDate,
          selected_language: language,
          wallet_id: walletId,
        }),
      });
  
      if (!response.ok) {
        throw new Error(i18n.t('endAndPrize.error_message'));
      }
  
      const data = await response.json();
  
      router.push({
        pathname: '/(menu)',
        params: {
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      const err = error as Error;
      Alert.alert(i18n.t('endAndPrize.error_title'), err.message);
    }
  };

  // Handle redirect to ICP Group Wallet
  const redirectToICPGroupWallet = async () => {
    const url = `https://orbitwallet.io/en/login`;
    await Linking.openURL(url);
    setWalletInputVisible(true);
    setSelectedPrize(10)
  };

  // Handle the deep link after redirection from ICP Group Wallet
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      const parsedUrl = Linking.parse(url);
      const principal = parsedUrl.queryParams?.principal;  // Extracting the principal

      if (principal) {
        console.log("Login Success! Principal:", principal);
        await SecureStore.setItemAsync("icp_identity", principal); // Store principal securely
        Alert.alert("ICP Authentication Successful", `Principal: ${principal}`);
      } else {
        console.log("Error: No principal found in the deep link.");
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => {
      // Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{i18n.t('endAndPrize.challenge_end_date')}</Text>
            <Text style={styles.subtitle}>{i18n.t('endAndPrize.recommendation')}</Text>

            <TouchableOpacity style={styles.dateButton} onPress={toggleDatePicker}>
              <Text style={styles.dateButtonText}>{formattedDate}</Text>
            </TouchableOpacity>

            {isPickerVisible && (
              <DateTimePicker
                mode="single"
                date={date}
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.prizeTitle}>{i18n.t('endAndPrize.choose_prize')}</Text>
            <Text style={styles.prizeSubtitle}>{i18n.t('endAndPrize.prize_info')}</Text>

            {/* <TouchableOpacity
          style={styles.prizeButton}
          onPress={() => setPrizeModalVisible(true)}
        >
          <Text style={styles.prizeButtonText}>
            {selectedPrize
              ? prizes.find(prize => prize.value === selectedPrize)?.label
              : i18n.t('endAndPrize.select_prize')}
          </Text>
        </TouchableOpacity> */}

            <PrizeModal
              isVisible={isPrizeModalVisible}
              prizes={prizes}
              selectedPrize={selectedPrize}
              onSelectPrize={setSelectedPrize}
              onClose={() => setPrizeModalVisible(false)}
            />

            {/* New button for ICP Group Wallet */}
            <TouchableOpacity
              style={styles.icpButton}
              onPress={redirectToICPGroupWallet}
            >
              <Text style={styles.icpButtonText}>
                {i18n.t('endAndPrize.icp_group_wallet')}
              </Text>
            </TouchableOpacity>
            {isWalletInputVisible && (
              <TextInput
                style={styles.walletInput}
                placeholder="Wallet-ID"
                placeholderTextColor="#888"
                value={walletId}
                onChangeText={setWalletId}
              />
            )}

          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>{i18n.t('endAndPrize.create')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center'
  },
  dateButton: {
    padding: 15,
    backgroundColor: Colors.darkGreen,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  prizeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  prizeSubtitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: Colors.darkGreen,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  prizeButton: {
    padding: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.darkGreen,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  prizeButtonText: {
    fontSize: 16,
    color: Colors.darkGreen,
  },
  icpButton: {
    padding: 15,
    backgroundColor: '#4200A2',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  icpButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  walletInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
});

export default EndAndPrize;
