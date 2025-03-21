import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import i18n from '../../languages/i18n';

const Feedback = () => {
    const router = useRouter();

    const handleFeedbackPress = (type: string) => {
        router.push({
            pathname: '/(menu)/FeedChat',
            params: { feedbackType: type },
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <Text style={styles.title}>{i18n.t('feedbackScreen.title')}</Text>

                    <View style={styles.gridContainer}>
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleFeedbackPress('Task Ideas')}
                        >
                            <MaterialIcons name="lightbulb" size={40} color={Colors.darkGreen} />
                            <Text style={styles.cardText}>{i18n.t('feedbackScreen.taskIdeas')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleFeedbackPress('Missing Features')}
                        >
                            <MaterialIcons name="build" size={40} color={Colors.darkGreen} />
                            <Text style={styles.cardText}>{i18n.t('feedbackScreen.missingFeatures')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleFeedbackPress('App Bugs')}
                        >
                            <MaterialIcons name="bug-report" size={40} color={Colors.darkGreen} />
                            <Text style={styles.cardText}>{i18n.t('feedbackScreen.appBugs')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleFeedbackPress('Other')}
                        >
                            <MaterialIcons name="question-answer" size={40} color={Colors.darkGreen} />
                            <Text style={styles.cardText}>{i18n.t('feedbackScreen.other')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
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
        marginBottom: 30,
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        aspectRatio: 1,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: Colors.darkGreen,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.darkGreen,
        textAlign: 'center',
    },
});

export default Feedback;
