import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'; // Import Clipboard
import Colors from '../../constants/Colors';
import i18n from '../../languages/i18n';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

const JoinGroup = () => {
    const { walletId } = useLocalSearchParams();
    const [nextButtonIsVisible, setNextButtonIsVisible] = useState(false);
    const router = useRouter();

    const copyToClipboardWalletId = async (text) => {
        if (text) {
            await Clipboard.setStringAsync(text);
            Alert.alert(i18n.t('groupDetailsPage.walletIdCopied'));
        } else {
            Alert.alert(i18n.t('groupDetailsPage.noWalletId'));
        }
    };

    // Handle redirect to ICP Group Wallet
    const redirectToICPGroupWallet = async () => {
        const url = `https://orbitwallet.io/en/login`;
        await Linking.openURL(url);
        setNextButtonIsVisible(true);
    };

    const handleNext = () => {
        
        router.push({
            pathname: '/(menu)',
            params: {
              timestamp: Date.now()
            },
          });
      };

    return (
        <View style={styles.scrollContainer}>
            <Text style={styles.inviteText}>
                <Text style={styles.boldText}>
                    Join the Group Wallet by copying the wallet ID and then accessing the wallet using the link below:
                </Text>
            </Text>
            {/* Wallet-ID Section */}
            <View style={styles.walletSection}>
                <Text style={styles.walletLabel}>{i18n.t('groupDetailsPage.walletIdLabel')}</Text>
                <View style={styles.walletIdContainer}>
                    <Text style={styles.walletIdText}>
                        {walletId || i18n.t('groupDetailsPage.noWalletId')}
                    </Text>
                    {walletId && (
                        <TouchableOpacity onPress={() => copyToClipboardWalletId(walletId)} style={styles.copyIcon}>
                            <MaterialIcons name="content-copy" size={24} color={Colors.darkGreen} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.icpButton}
                onPress={redirectToICPGroupWallet}
            >
                <Text style={styles.icpButtonText}>
                    {i18n.t('groupDetailsPage.icp_group_wallet')}
                </Text>
            </TouchableOpacity>

            {nextButtonIsVisible && (
                <TouchableOpacity style={styles.buttonContainer} onPress={handleNext}>
                    <Text style={styles.buttonText}>{i18n.t('nameGroup.next')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    icpButton: {
        padding: 15,
        backgroundColor: '#4200A2',
        borderRadius: 8,
        alignItems: 'center',
        margin: 20,
    },
    icpButtonText: {
        fontSize: 16,
        color: '#fff',
    },
    walletSection: {
        marginTop: 20,
        alignItems: 'center', // Centers the label
    },
    walletLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.darkGreen,
        textAlign: 'center', // Ensures text is centered
        marginBottom: 5,
    },
    walletIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Light gray background for better visibility
        padding: 10,
        borderRadius: 8,
        justifyContent: 'space-between',
        width: '100%', // Ensures it takes full width
        maxWidth: 300, // Limits width for better aesthetics
    },
    walletIdText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.darkGreen,
    },
    copyIcon: {
        marginLeft: 10, // Adds margin between Wallet-ID and copy icon
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: Colors.white,
    },
    inviteText: {
        margin: 30,
        fontSize: 18,
        textAlign: 'center',
        color: Colors.gray,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.darkGreen,
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
