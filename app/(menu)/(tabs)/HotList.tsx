import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import i18n from '../../../languages/i18n';
import UserChallengeStaticModal from '../../../components/Modals/UserChallengesStatic'; // Import the modal
import { useAppContext } from '../../../context/GroupContext';
import { API_URL } from '../../../constants/constants';
import Colors from '../../../constants/Colors';
import { useWebSocket } from '../../../context/WebSocketContext';
import { Member, Task } from '../../../context/Types';

const HotList = () => {
  const HotListIcon = require('../../../assets/HotListIcons/HotList.png');
  const Place1 = require('../../../assets/HotListIcons/Place1.png');
  const Place2 = require('../../../assets/HotListIcons/Place2.png');
  const Place3 = require('../../../assets/HotListIcons/Place3.png');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const { data } = useAppContext();
  const { socket } = useWebSocket();
  const [members, setMembers] = useState<Member[]>([]);

  // ✅ Function to calculate remaining days
  const calculateDaysRemaining = (): number => {
    if (!data?.groupEndDate) return 0; // Ensure groupEndDate exists

    const now = new Date(); // Current date
    const endDate = new Date(data.groupEndDate); // Convert string to Date

    if (isNaN(endDate.getTime())) return 0; // Handle invalid date cases

    const diffTime = endDate.getTime() - now.getTime(); // Difference in milliseconds
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to full days
  };


  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://${API_URL}:5001/api/group-members/${data?.groupId}`);
      if (!response.ok) {
        throw new Error(i18n.t('hotList.errorFetchingMembers'));
      }
      let result = await response.json();

      // Sort members by points in descending order
      result.sort((a: { points: number; }, b: { points: number; }) => b.points - a.points);

      // Assign ranks dynamically based on sorted order
      let lastPoints: null = null;
      let lastRank = 0;
      result = result.map((member: { points: null; }, index: number) => {
        if (member.points !== lastPoints) {
          lastRank = index + 1; // Assign a new rank if points change
        }
        lastPoints = member.points;
        return { ...member, rank: lastRank }; // Update member with rank
      });

      setMembers(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.groupId) {
      fetchGroupMembers();
    }
  }, [data?.groupId]);

  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (newMessage) => {
        setMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.auth_uid === newMessage.auth_uid
              ? { ...member, points: member.points + (newMessage.task?.task_points || 0) }
              : member
          )
        );
      });

      return () => {
        socket.off("receiveMessage"); // No need to check if `socket` exists again
      };
    }
  }, [socket]);


  useEffect(() => {
    if (socket) {
      console.log("✅ Listening for messageDeleted event in Members screen...");

      const handleMessageDeleted = ({ task }: { task: Task }) => {
        if (task) {
          setMembers((prevMembers) =>
            prevMembers.map((member) =>
              member.auth_uid === task.auth_uid
                ? { ...member, points: member.points - (task.points_earned || 0) }
                : member
            )
          );
        }
      };

      socket.on("messageDeleted", handleMessageDeleted);

      return () => {
        if (socket) {
          console.log("🧹 Removing messageDeleted event listener in Members screen...");
          socket.off("messageDeleted", handleMessageDeleted);
        }
      };
    }
  }, [socket]);


  useEffect(() => {
    if (data?.groupId) {
      fetchGroupMembers();
    }
  }, [data?.groupId]);

  const handlePressMember = (member: Member) => {
    setSelectedUser(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{i18n.t('hotList.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('hotList.title')}</Text>

      <View style={styles.endDateContainer}>
        <Text style={styles.endDateText}>
          {i18n.t('hotList.challengeEndsIn')}{' '}
          <Text style={styles.boldText}>{calculateDaysRemaining()}</Text>{' '}
          {i18n.t('hotList.days')}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        <Image source={HotListIcon} style={styles.hotListImage} />
        {/* Added prize text below the HotListIcon */}
        <Text style={styles.prize}>{i18n.t('hotList.prizeForWinner')}: </Text>
        <Text style={styles.prizeText}>
          {data?.groupPrizeText?.replace(/\s*\(.*?\)\s*/g, ' ') || 'No prize information available'}
        </Text>

      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={({ item }) => {
          let rankDisplay;
          if (item.rank === 1) {
            rankDisplay = <Image source={Place1} style={styles.rankIcon} />;
          } else if (item.rank === 2) {
            rankDisplay = <Image source={Place2} style={styles.rankIcon} />;
          } else if (item.rank === 3) {
            rankDisplay = <Image source={Place3} style={styles.rankIcon} />;
          } else {
            rankDisplay = <Text style={styles.rank}>{item.rank}</Text>;
          }

          return (
            <TouchableOpacity onPress={() => handlePressMember(item)} style={styles.row}>
              {rankDisplay}
              <Image source={{ uri: item.profile_image }} style={styles.image} />
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.points}>{i18n.t('hotList.points', { points: item.points })}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <UserChallengeStaticModal
        visible={isModalVisible}
        onClose={closeModal}
        groupPackageId={data?.groupPackageId}
        language={data?.language}
        groupId={data?.groupId}
        user_id={selectedUser?.user_id}
        // groupName={data?.groupName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  endDateIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },
  endDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  rankIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  rank: {
    width: 30,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  hotListImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  prizeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  prize: {
    margin: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'darkgreen', // Text color
    borderColor: 'darkgreen', // Outline color
    borderWidth: 2, // Outline thickness
    paddingVertical: 5, // Top & bottom padding
    paddingHorizontal: 10, // Left & right padding
    borderRadius: 8, // Rounded corners
    textAlign: 'center', // Center align text
    alignSelf: 'center', // Center the text in the view
  },
  boldText: {
    color: Colors.red,
  },
});

export default HotList;