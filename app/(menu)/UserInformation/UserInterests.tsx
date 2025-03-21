import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/constants';
import { auth } from '../../../constants/firebaseConfig';
import { Category } from '../../../context/Types';


const UserInterests = () => {
    const [categories, setCategories] = useState<Category[]>([
        { label: i18n.t('userInterests.categories.fitness'), value: 'Fitness' },
        { label: i18n.t('userInterests.categories.health'), value: 'Health' },
        { label: i18n.t('userInterests.categories.exploring'), value: 'Exploring' },
        { label: i18n.t('userInterests.categories.selfDevelopment'), value: 'Self-development' },
        { label: i18n.t('userInterests.categories.relationshipsNetworking'), value: 'Relationships and Networking' },
        { label: i18n.t('userInterests.categories.foodDrinks'), value: 'Food and Drinks' },
        { label: i18n.t('userInterests.categories.entertainment'), value: 'Entertainment' },
        { label: i18n.t('userInterests.categories.sports'), value: 'Sports' },
        { label: i18n.t('userInterests.categories.nightout'), value: 'Nightout' },
        { label: i18n.t('userInterests.categories.cityExploration'), value: 'Exploring the city' },
        { label: i18n.t('userInterests.categories.seasonalActivities'), value: 'Seasonal activities' },
    ]);
    

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const router = useRouter();
    const timestamp = Date.now();

    const handleCategoryPress = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories((prev) => prev.filter((item) => item !== category));
        } else if (selectedCategories.length < 3) {
            setSelectedCategories((prev) => [...prev, category]);
        } else {
            Alert.alert(
                i18n.t('userInterests.categories.limitReachedTitle'),
                i18n.t('userInterests.categories.limitReachedMessage')
            );
        }
    };

    const handleNext = async () => {
        if (selectedCategories.length < 3) {
            Alert.alert(
                i18n.t('userInterests.categories.insufficientSelectionTitle'),
                i18n.t('userInterests.categories.insufficientSelectionMessage')
            );
            return;
        }
    
        try {
            // Get the currently authenticated user's UID
            const currentUser = auth.currentUser || '' ;
            if (!currentUser) {
                Alert.alert(
                    i18n.t('userInterests.categories.authErrorTitle'),
                    i18n.t('userInterests.categories.authErrorMessage')
                );
                return;
            }
    
            const uid = currentUser.uid; // Get the user's UID
    
            // Update user interests in the backend
            await axios.put(`http://${API_URL}:5001/api/users/${uid}`, {
                interest1: selectedCategories[0],
                interest2: selectedCategories[1],
                interest3: selectedCategories[2],
            });
    
            router.replace({
                pathname: '/(menu)',
                params: { timestamp: timestamp.toString() }
            });
        } catch (error) {
            console.error('Error updating user interests:', error);
            Alert.alert(
                i18n.t('userInterests.categories.updateErrorTitle'),
                i18n.t('userInterests.categories.updateErrorMessage')
            );
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={categories}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => handleCategoryPress(item.value)}
                    >
                        <Ionicons
                            name={selectedCategories.includes(item.value) ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={Colors.green}
                        />
                        <Text style={styles.categoryText}>{item.label}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
            />

            <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
                {i18n.t('userInterests.categories.selectedCount', { count: selectedCategories.length })}
            </Text>
            </View>

            <TouchableOpacity
                style={[styles.nextButton, selectedCategories.length < 3 && styles.disabledButton]}
                onPress={handleNext}
                disabled={selectedCategories.length < 3}
            >
                <Text style={styles.nextButtonText}>{i18n.t('userInterests.categories.nextButton')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#2B2B2B',
    },
    listContainer: {
        paddingBottom: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#1F1F1F',
        borderRadius: 5,
        marginBottom: 10,
    },
    categoryText: {
        color: Colors.white,
        fontSize: 18,
        marginLeft: 10,
    },
    progressContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    progressText: {
        color: Colors.white,
        fontSize: 16,
    },
    nextButton: {
        alignItems: 'center',
        padding: 15,
        backgroundColor: Colors.green,
        borderRadius: 5,
    },
    nextButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '500',
    },
    disabledButton: {
        backgroundColor: '#555',
    },
});

export default UserInterests;
