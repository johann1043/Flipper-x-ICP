import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  SectionList
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import Colors from '../../constants/Colors';
import { useAppContext } from '../../context/GroupContext';
import { useLocalSearchParams } from 'expo-router';
import i18n from '../../languages/i18n';
import { API_URL } from '../../constants/constants';
import * as Linking from 'expo-linking';

const GroupDetailsPage = () => {
  const { data } = useAppContext();
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const { timestamp } = useLocalSearchParams();
  const { setData } = useAppContext();
  const [walletId, setWalletId] = useState('');
  const [isWalletInputVisible, setWalletInputVisible] = useState(false);

  const fetchGroupMembers = async () => {
    try {
      const response = await fetch(`http://${API_URL}:5001/api/group-members/${data.groupId}`);
      const membersData = await response.json();

      console.log(membersData)

      setData((prevData) => ({
        ...prevData,
        groupMembers: membersData, // Add group members to the data
      }));
      setMembers(membersData)
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }
  };


  useEffect(() => {
    fetchGroupMembers();
  }, []);

  useEffect(() => {
    fetchGroupMembers();
  }, [timestamp]);

  const copyToClipboardGroupPin = (text) => {
    Clipboard.setStringAsync(text);
    Alert.alert(i18n.t('groupDetailsPage.groupPinCopied'));
  };

  const copyToClipboardWalletId = (text) => {
    Clipboard.setStringAsync(text);
    Alert.alert(i18n.t('groupDetailsPage.walletIdCopied'));
  };

  const renderLanguage = () => {
    if (data?.language === 'en') {
      return (
        <View style={styles.languageContainer}>
          <Text style={styles.languageText}>Language: English 🇺🇸</Text>
        </View>
      );
    } else if (data?.language === 'de') {
      return (
        <View style={styles.languageContainer}>
          <Text style={styles.languageText}>Sprache: Deutch 🇩🇪</Text>
        </View>
      );
    }
    return null;
  };

  // Handle redirect to ICP Group Wallet
  const redirectToICPGroupWallet = async () => {
    const url = `https://orbitwallet.io/en/login`;
    await Linking.openURL(url);
    setWalletInputVisible(true);
  };


  const renderMembers = () =>
    members.map((item) => (
      <View style={styles.memberRow} key={item.user_id.toString()}>
        <Image source={{ uri: item.profile_image }} style={styles.memberImage} />
        <Text style={styles.memberUsername}>{item.username}</Text>
      </View>
    ));



  return (
    <SectionList
      sections={[
        {
          title: 'Group Details',
          data: [
            {
              key: 'groupImageSection',
              component: (
                <View style={styles.groupImageContainer}>
                  <Image
                    source={{
                      uri: data?.groupImage || 'https://via.placeholder.com/150',
                    }}
                    style={styles.groupImage}
                  />
                  <Text style={styles.inviteText}>
                    <Text style={styles.boldText}>
                      {i18n.t('groupDetailsPage.inviteMessage')}
                    </Text>
                  </Text>

                  {/* Group-Pin Section */}
                  <View style={styles.copySection}>
                    <Text style={styles.label}>{i18n.t('groupDetailsPage.groupPinLabel')}</Text>
                    <TouchableOpacity onPress={() => copyToClipboardGroupPin(data?.groupPin)}>
                      <MaterialIcons name="content-copy" size={24} color={Colors.darkGreen} />
                    </TouchableOpacity>
                    <Text style={styles.groupPin}>
                      {data?.groupPin || i18n.t('groupDetailsPage.groupPin')}
                    </Text>
                  </View>

                  {/* Wallet-ID Section */}
                  <View style={styles.walletSection}>
                    <Text style={styles.walletLabel}>{i18n.t('groupDetailsPage.walletIdLabel')}</Text>
                    <View style={styles.walletIdContainer}>
                      <Text style={styles.walletIdText}>
                        {data?.walletId || i18n.t('groupDetailsPage.noWalletId')}
                      </Text>
                      <TouchableOpacity onPress={() => copyToClipboardWalletId(data?.walletId)} style={styles.copyIcon}>
                        <MaterialIcons name="content-copy" size={24} color={Colors.darkGreen} />
                      </TouchableOpacity>
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

                  {renderLanguage()}
                </View>
              ),

            },
            {
              key: 'groupNameSection',
              component: (
                <View style={styles.infoSection}>
                  <Text style={styles.titleText}>{i18n.t('groupDetailsPage.groupName')}</Text>
                  <Text style={styles.infoText}>
                    {data?.groupName || i18n.t('groupDetailsPage.noEndDate')}
                  </Text>
                </View>
              ),
            },
            {
              key: 'groupDescriptionSection',
              component: (
                <View style={styles.infoSection}>
                  <Text style={styles.titleText}>{i18n.t('groupDetailsPage.description')}</Text>
                  <Text style={styles.infoText}>
                    {data?.groupDescription || i18n.t('groupDetailsPage.noEndDate')}
                  </Text>
                </View>
              ),
            },
            {
              key: 'groupPrizeSection',
              component: (
                <View style={styles.infoSection}>
                  <Text style={styles.titleText}>{i18n.t('groupDetailsPage.prize')}</Text>
                  <Text style={styles.infoText}>
                    {data?.groupPrizeText || i18n.t('groupDetailsPage.noPrize')}
                  </Text>
                </View>
              ),
            },
            {
              key: 'groupEndDateSection',
              component: (
                <View style={styles.infoSection}>
                  <Text style={styles.titleText}>{i18n.t('groupDetailsPage.endDate')}</Text>
                  <Text style={styles.infoText}>
                    {data?.groupEndDate
                      ? dayjs(data.groupEndDate).format('DD MMM YY')
                      : i18n.t('groupDetailsPage.noEndDate')}
                  </Text>
                </View>
              ),
            },
          ],
        },
        {
          title: 'Group Members',
          data: [
            {
              key: 'membersSection',
              component: membersLoading ? (
                <ActivityIndicator size="small" color={Colors.darkGreen} />
              ) : (
                members.map((item) => (
                  <View style={styles.memberRow} key={item.user_id.toString()}>
                    <Image source={{ uri: item.profile_image }} style={styles.memberImage} />
                    <Text style={styles.memberUsername}>{item.username}</Text>
                  </View>
                ))
              ),
            },
          ],
        },
      ]}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => item.component}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.scrollContainer}
    />
  );

};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.white,
  },
  groupImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  groupImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.darkGreen,
  },
  inviteText: {
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
    color: Colors.gray,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.darkGreen,
  },
  copySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  groupPin: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGreen,
    marginLeft: 10,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  flagIcon: {
    width: 20,
    height: 14,
    marginRight: 10,
  },
  languageText: {
    fontSize: 16,
    color: Colors.gray,
  },
  infoSection: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.lightGreen,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGreen,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.gray,
    lineHeight: 20,
  },
  membersSection: {
    marginTop: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberUsername: {
    fontSize: 16,
    color: Colors.gray,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGreen,
    marginBottom: 5,
  },
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
  

});

export default GroupDetailsPage;
