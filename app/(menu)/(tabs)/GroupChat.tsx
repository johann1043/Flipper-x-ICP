import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ImageBackground, Text, TouchableOpacity, Image } from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import Colors from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ChatMessageBox from '../../../components/ChatMessageBox';
import ReplyMessageBar from '../../../components/ReplyMessageBar';
import PickedImageBar from '../../../components/PickedImageBar';
import { launchImageLibrary } from 'react-native-image-picker';
import { Dimensions } from 'react-native';
import { useAppContext } from '../../../context/GroupContext';
import i18n from '../../../languages/i18n';
import { API_URL } from '../../../constants/constants';
import ImageModal from '../../../components/Modals/ShowImageModal';
import MessageImageModal from '../../../components/Modals/MessageImageModal';
import * as ImageManipulator from 'expo-image-manipulator';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../../../constants/firebaseConfig';

const GroupChat = () => {
  const BackgroundImage = require('../../../assets/ChatBackground.png');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyId, setReplyId] = useState<string | number | null>(null);
  const uid = auth.currentUser?.uid || '';
  const [replyMessage, setReplyMessage] = useState<IMessage | null>(null);
  const swipeableRowRef = useRef<{ close: () => void } | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const { data } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState({ main: null, task: null });
  const [messageImageModalVisible, setMessageImageModalVisible] = useState(false);
  const [selectedMessageImage, setSelectedMessageImage] = useState(null);
  const { socket } = useWebSocket();
  const { socketRef } = useWebSocket();
  const groupIdRef = useRef(data?.groupId ?? null);

  const handlePickImage = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1 },
      async (response) => {
        if (response.errorMessage) {
          return Alert.alert(i18n.t('groupChat.errorUploadingImage'));
        }

        if (response.assets && response.assets.length > 0) {
          let pickedPhoto = response.assets[0];

          if (!pickedPhoto || !pickedPhoto.width || !pickedPhoto.height || !pickedPhoto.uri) {
            return Alert.alert(i18n.t('groupChat.errorUploadingImage'));
          }

          let actions = [];

          if (pickedPhoto.width > pickedPhoto.height) {
            actions.push({ rotate: 90 });
          }

          actions.push({
            resize: {
              width: Math.min(pickedPhoto.width, pickedPhoto.height),
              height: Math.max(pickedPhoto.width, pickedPhoto.height),
            },
          });

          try {
            let processedImage = await ImageManipulator.manipulateAsync(
              pickedPhoto.uri,
              actions,
              { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPickedImage(processedImage.uri);
          } catch (error) {
            Alert.alert(i18n.t('groupChat.errorProcessingImage'));
          }
        }
      }
    );
  };


  const fetchMessages = async (cursor = null) => {

    if (!data || !data.groupId) {
      Alert.alert(i18n.t('groupChat.errorFetchingMessages'));
      return;
    }

    try {
      const url = new URL(`http://${API_URL}:5001/api/messages/${data.groupId}`);
      url.searchParams.append("limit", "20");
      if (cursor) url.searchParams.append("cursor", cursor);

      const response = await fetch(url.toString());

      if (!response.ok) throw new Error(i18n.t('groupChat.errorFetchingMessages'));

      const { messages: newMessages, nextCursor } = await response.json();

      setMessages((prevMessages) => GiftedChat.append(newMessages, prevMessages));
      setNextCursor(nextCursor);
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert(i18n.t('groupChat.errorFetchingMessages'));
    } finally {
      setLoading(false);
    }
  };


  const onLoadEarlier = () => {
    if (nextCursor) fetchMessages(nextCursor);
  };

  // Function to update last_read_message_id
  const updateLastReadMessage = async () => {
    if (!data?.groupId || !messages.length) return;

    try {
      const lastMessage = messages[0] as any;
      const response = await fetch(`http://${API_URL}:5001/api/groups/${data.groupId}/members/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ last_read_message_id: lastMessage?._id }),
      });

      if (!response.ok) {
        console.error('Failed to update last_read_message_id:', await response.text());
      }
    } catch (error) {
      console.error('Error updating last_read_message_id:', error);
    }
  };

  // Use useFocusEffect to trigger the update when screen is focused
  useFocusEffect(
    useCallback(() => {
      updateLastReadMessage();
    }, [messages]) // Dependency ensures it runs when messages update
  );

  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', async (newMessage) => {
        setMessages((prevMessages: any[]) => [newMessage.message, ...prevMessages]);
      });
    }

    return () => {
      if (socket) {
        socket.off('receiveMessage');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (socket) {

      const handleDeleteMessage = ({ messageId }: { messageId: number }) => {
        setMessages((prevMessages) =>
          prevMessages.filter((message: any) => message._id !== messageId)
        );
      };

      socket.on("messageDeleted", handleDeleteMessage);

      return () => {
        if (socket) {
          socket.off("messageDeleted", handleDeleteMessage);
        }
      };
    }
  }, [socket]);

  const handleSend = async (newMessages: IMessage[] = []) => {
    const newMessage = newMessages[0];

    if (!newMessage?.text?.trim() && !pickedImage) {
      return Alert.alert("Cannot send an empty message.");
    }

    try {
      // Prepare FormData for API request
      const formData = new FormData();
      formData.append("text", newMessage.text);
      formData.append("group_id", data?.groupId ?? '');
      formData.append("uid", uid);
      formData.append("message_type", pickedImage ? "image" : "text");

      if (replyId) formData.append("reply_to", String(replyId));
      if (pickedImage) {
        formData.append("image", {
          uri: pickedImage,
          name: `image-${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      // Send message to backend API first
      const response = await fetch(`http://${API_URL}:5001/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error("Error sending message.");

      // ✅ Ensure socket is available before emitting a message
      if (socket) {
        socket.emit("sendMessage", {
          groupId: data?.groupId ?? '',
          message: responseData
        });
      } else {
        console.error("WebSocket is not connected.");
      }

      setReplyMessage(null);
      setReplyId(null);
      setPickedImage(null);

    } catch (error) {
      Alert.alert("Error sending message.");
      console.error(error);
    }
  };


  const handleReply = (message: any) => {
    setReplyMessage(message as any);
    setReplyId((message as any)?._id);
  };

  useEffect(() => {
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
  }, [replyMessage]);

  useEffect(() => {
  }, [socketRef.current]);

  useEffect(() => {
    groupIdRef.current = data?.groupId ?? null;
  }, [data?.groupId]);


  const handleDeleteMessage = async (messageId: number) => {

    try {
      if (!socketRef.current) {
        console.error("❌ WebSocket is not connected at deleteMessage.");
        return;
      }

      const response = await fetch(`http://${API_URL}:5001/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(i18n.t('groupChat.errorDeletingMessage'));
      }

      const responseData = await response.json();
      const deletedTask = responseData.task || null;

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== messageId)
      );

      socketRef.current.emit("deleteMessage", {
        groupId: groupIdRef.current, // ✅ Fix stale closure issue
        messageId,
        task: deletedTask,
      });

    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };





  const renderMessageImage = (props: any) => {
    const { currentMessage } = props;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedMessageImage(currentMessage.image);
          setMessageImageModalVisible(true);
        }}
      >
        <Image
          source={{ uri: currentMessage.image }}
          style={{
            width: 200,
            height: 200,
            borderRadius: 10,
            resizeMode: 'cover',
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderBubble = useMemo(
    () => (props: any) => {

      if (!props.currentMessage) return null;

      const isTaskMessage = props.currentMessage?.taskId;
      const mainImage = props.currentMessage?.image; // Main image
      const taskImage = props.currentMessage?.taskImage; // Secondary image

      return (
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: isTaskMessage ? '#ffed89' : '#DCF8C6', // Highlight task messages
              maxWidth: isTaskMessage ? '100%' : screenWidth * 0.6,
              borderRadius: isTaskMessage ? 15 : 15, // Rounded edges for task messages
            },
            left: {
              backgroundColor: isTaskMessage ? '#ffed89' : '#E4E6EB',
              maxWidth: isTaskMessage ? '100%' : screenWidth * 0.6,
              borderRadius: isTaskMessage ? 15 : 15,
            },
          }}
          textStyle={{
            right: { color: '#333' },
            left: { color: '#333' },
          }}
          renderCustomView={() => (
            <>
              {isTaskMessage && mainImage && (
                <View style={styles.taskedBubbleContainer}>
                  {/* User's Name */}
                  <Text style={styles.userNameText}>
                    {props.currentMessage?.user.name}
                  </Text>

                  {/* Wrapper to ensure correct overlay positioning */}
                  <View style={styles.imageWrapper}>
                    {mainImage && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImages({ main: mainImage, task: taskImage });
                          setModalVisible(true);
                        }}
                      >
                        <Image source={{ uri: mainImage }} style={styles.fullImage} resizeMode="cover" />
                      </TouchableOpacity>
                    )}

                    {taskImage && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImages({ main: mainImage, task: taskImage });
                          setModalVisible(true);
                        }}
                        style={styles.overlayImageContainer} // Moved inside wrapper
                      >
                        <Image source={{ uri: taskImage }} style={styles.overlayImage} resizeMode="cover" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {props.currentMessage.reply_to && (
                <View style={styles.replyBubbleContainer}>
                  <View style={styles.replyContent}>
                    <Text style={styles.replyUser}>
                      {props.currentMessage.reply_to.user.name}
                    </Text>
                    <View style={styles.replyRow}>
                      {props.currentMessage.reply_to.image && (
                        <Image
                          source={{ uri: props.currentMessage.reply_to.image }}
                          style={styles.replyImage}
                        />
                      )}
                      <Text style={styles.replyText}>
                        {props.currentMessage.reply_to.text}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
          {...(isTaskMessage && { currentMessage: { ...props.currentMessage, image: null } })}
          onLongPress={() => {
            Alert.alert(
              i18n.t('groupChat.messageOptions'),
              i18n.t('groupChat.chooseAction'),
              [
                {
                  text: i18n.t('groupChat.reply'),
                  onPress: () => handleReply(props.currentMessage),
                },
                {
                  text: i18n.t('groupChat.delete'),
                  onPress: () => {
                    Alert.alert(
                      i18n.t('groupChat.deleteMessageTitle'),
                      i18n.t('groupChat.deleteMessageConfirmation'),
                      [
                        {
                          text: i18n.t('groupChat.cancel'),
                          style: 'cancel',
                        },
                        {
                          text: i18n.t('groupChat.delete'),
                          style: 'destructive',
                          onPress: () => handleDeleteMessage(props.currentMessage._id),
                        },
                      ]
                    );
                  },
                  style: 'destructive',
                },
                {
                  text: i18n.t('groupChat.cancel'),
                  style: 'cancel',
                },
              ],
              { cancelable: true }
            );
          }}
        />
      );
    },
    [screenWidth]
  );


  const renderSend = useMemo(
    () => (props: any) => (
      <View style={styles.sendContainer}>
        <Send
          {...props}
          containerStyle={{
            justifyContent: 'center',
          }}>
          <MaterialCommunityIcons
            name="send-circle"
            size={35}
            color={Colors.darkGreen}
          />
        </Send>
      </View>
    ),
    []
  );

  useEffect(() => {
    if (!data?.groupId) {
      return;
    }

    setMessages([]); // Optional: Clear messages
    fetchMessages();
  }, [data?.groupId]);



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={BackgroundImage} style={{ flex: 1 }}>
        <ImageModal
          visible={modalVisible}
          images={selectedImages}
          onClose={() => setModalVisible(false)}
        />

        <MessageImageModal
          visible={messageImageModalVisible}
          imageUri={selectedMessageImage}
          onClose={() => setMessageImageModalVisible(false)}
        />

        <GiftedChat
          messages={messages.filter((msg) => msg != null)}
          onSend={(messages: any[]) => handleSend(messages)}
          text={text}
          onInputTextChanged={setText}
          user={{ _id: uid }}
          loadEarlier={!!nextCursor}
          onLoadEarlier={onLoadEarlier}
          isLoadingEarlier={loading}
          renderBubble={renderBubble}
          renderSend={renderSend}
          alwaysShowSend={true}
          textInputProps={styles.composer}
          renderUsernameOnMessage={true}
          renderMessageImage={renderMessageImage}
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
          renderChatFooter={() => (
            <>
              {pickedImage && (
                <PickedImageBar
                  imageUri={pickedImage}
                  clearImage={() => setPickedImage(null)}
                />
              )}
              <ReplyMessageBar
                clearReply={() => {
                  setReplyMessage(null);
                  setReplyId(null);
                }}
                setReplyId={setReplyId}
                message={replyMessage}
              />
            </>
          )}
          onLongPress={(context, message: IMessage) => handleReply(message)}

          renderMessage={(props) => (
            <ChatMessageBox
              {...props}
              setReplyOnSwipeOpen={(message: IMessage) => {
                setReplyMessage(message);
                setReplyId(message._id);
              }}
              updateRowRef={(ref) => {
                if (
                  ref &&
                  replyMessage &&
                  ref.props.children.props.currentMessage?._id === replyMessage._id
                ) {
                  swipeableRowRef.current = ref;
                }
              }}
            />
          )}
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
  replyBubbleContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.darkGreen,
    borderRadius: 5,
    width: 'auto',
  },
  replyContent: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 8,
  },
  replyUser: {
    fontWeight: '600',
    color: '#89BC0C',
    marginBottom: 5,
  },
  replyRow: {
    flexDirection: 'row', // Arrange items in a row
    alignItems: 'center', // Align items vertically in the center
  },
  replyText: {
    color: '#333',
    fontSize: 14,
    marginLeft: 10, // Add spacing between image and text
    flexShrink: 1, // Allow text to wrap if it's long
  },
  replyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  taskMessageContainer: {
    marginBottom: 5, // Space between the task text and the main message text
    padding: 5,
    backgroundColor: '#ffed89', // Match the bubble color for consistency
    borderRadius: 5,
  },
  taskMessageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  taskMessageImageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10, // Space between the image and the message content
  },
  taskMessageImage: {
    width: '100%', // Full width
    height: 200, // Adjust height as needed
    borderRadius: 10, // Optional: Round the edges
  },
  taskedBubbleContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#ffed89',
    borderRadius: 15,
    padding: 10,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  imageWrapper: {
    position: 'relative', // Ensures overlay is positioned relative to this
    width: '100%',
  },
  fullImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
  },
  overlayImageContainer: {
    position: 'absolute',
    top: 10, // Aligns it to the top of the primary image
    left: 10, // Aligns it to the left of the primary image
    width: 60,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    zIndex: 10,
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default GroupChat;
