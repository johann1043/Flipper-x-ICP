import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BackgroundImage from '../../assets/ChatBackground.png';
import Colors from '../../constants/Colors';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import axios from 'axios'; // Import axios for making API calls
import { useLocalSearchParams } from 'expo-router';
import i18n from '../../languages/i18n';
import { API_URL } from '../../constants/constants';
import * as ImageManipulator from 'expo-image-manipulator';
import { getAuth } from 'firebase/auth';
import { auth } from '../../constants/firebaseConfig'; // Ensure consistent Firebase instance

const FeedChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const uid = auth.currentUser?.uid || '';
  const { feedbackType } = useLocalSearchParams()


  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://${API_URL}:5001/api/feedback-messages/${uid}`
      );

      const fetchedMessages = response.data.map((message) => ({
        _id: message.id,
        text: `${i18n.t('feedChat.sendFeedback')} ${message.feedback_type}`,
        createdAt: new Date(message.created_at),
      }));

      setMessages(fetchedMessages);
    } catch (error) {
      Alert.alert(i18n.t('feedChat.errorFetchingMessages'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (newMessages = []) => {
    const newMessage = newMessages[0];

    if (!newMessage?.text?.trim() && !pickedImage) {
        return Alert.alert(i18n.t('feedChat.cannotSendEmptyMessage'));
    }

    const formattedMessage = {
        _id: newMessage._id,
        text: `${i18n.t('feedChat.sendFeedback')} ${feedbackType}`,
        createdAt: newMessage.createdAt || new Date().toISOString(),
        user: {
            _id: uid,
        },
        feedback_type: feedbackType,
        user_message: newMessage.text, // Include the user's typed message
    };

    setMessages((prevMessages) => GiftedChat.append(prevMessages, [formattedMessage]));

    try {
        const formData = new FormData();
        formData.append('auth_id', uid);
        formData.append('text', formattedMessage.text);
        if (feedbackType) formData.append('feedback_type', feedbackType);
        formData.append('user_message', newMessage.text); // Send user_message
        if (pickedImage) {
            formData.append('file', {
                uri: pickedImage,
                name: `image-${Date.now()}.jpg`,
                type: 'image/jpeg',
            });
            formData.append('message_type', 'image');
        } else {
            formData.append('message_type', 'text');
        }

        const response = await fetch(`http://${API_URL}:5001/api/feedback-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Server returned error:', text);
            throw new Error('Failed to send message');
        }

        const data = await response.json();

        setPickedImage(null);
    } catch (error) {
        Alert.alert(i18n.t('feedChat.errorSendingMessage'));
        console.error(error);

        setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg._id !== formattedMessage._id)
        );
    }
};

  

  const handlePickImage = () => {
      launchImageLibrary(
        { mediaType: 'photo', selectionLimit: 1 },
        async (response) => {
          if (response.errorMessage) {
            return Alert.alert(i18n.t('groupChat.errorUploadingImage'));
          }
    
          if (response.assets && response.assets.length > 0) {
            let pickedPhoto = response.assets[0];
    
            let actions = [];
            // iOS often saves images with incorrect orientation, so fix it
            if (pickedPhoto.width > pickedPhoto.height) {
              actions.push({ rotate: 90 });
            }
    
            actions.push({
              resize: {
                width: Math.min(pickedPhoto.width, pickedPhoto.height),
                height: Math.max(pickedPhoto.width, pickedPhoto.height),
              },
            });
    
            let processedImage = await ImageManipulator.manipulateAsync(
              pickedPhoto.uri,
              actions,
              { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );
    
            setPickedImage(processedImage.uri);
          }
        }
      );
    };

  useEffect(() => {
    fetchMessages(); // Fetch messages when the component mounts
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>{i18n.t('feedChat.activityIndicatorMessage')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={BackgroundImage} style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          onSend={(messages) => handleSend(messages)}
          text={text}
          onInputTextChanged={setText}
          user={{ _id: '1' }}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  backgroundColor: '#DCF8C6',
                  maxWidth: screenWidth * 0.6,
                },
                left: {
                  backgroundColor: '#E4E6EB',
                  maxWidth: screenWidth * 0.6,
                },
              }}
              textStyle={{
                right: { color: '#333' },
                left: { color: '#333' },
              }}
            />
          )}
          renderSend={(props) => (
            <View style={styles.sendContainer}>
              <Send
                {...props}
                containerStyle={{ justifyContent: 'center' }}
              >
                <MaterialCommunityIcons
                  name="send-circle"
                  size={35}
                  color={Colors.darkGreen}
                />
              </Send>
            </View>
          )}
          textInputProps={styles.composer}
          renderUsernameOnMessage={true}
          alwaysShowSend={true}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              renderActions={() => (
                <TouchableOpacity style={styles.actionIcon} onPress={handlePickImage}>
                  <Ionicons name="add" color={Colors.darkGreen} size={28} />
                </TouchableOpacity>
              )}
            />
          )}
          renderChatFooter={() =>
            pickedImage && (
              <Animated.View
                style={{ height: 100, flexDirection: 'row', backgroundColor: '#E4E9EB' }}
                entering={FadeInDown}
                exiting={FadeOutDown}
              >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                  <Image
                    source={{ uri: pickedImage }}
                    style={{ width: 60, height: 60, borderRadius: 8, marginRight: 10 }}
                  />
                  <Text style={{ flex: 1, color: Colors.gray }}>
                    {i18n.t('feedChat.selectedImageMessage')}
                  </Text>
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10 }}>
                  <TouchableOpacity onPress={() => setPickedImage(null)}>
                    <Ionicons name="close-circle-outline" color={Colors.darkGreen} size={28} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )
          }
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  composer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: 10,
    fontSize: 16,
    marginVertical: 4,
  },
  sendContainer: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 14,
  },
  inputToolbar: {
    backgroundColor: Colors.background,
  },
  actionIcon: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    left: 5,
  },
});

export default FeedChat;
