import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider } from '../context/GroupContext';
import { firebaseConfig } from '../constants/firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function RootLayout() {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (initializing) {
                setInitializing(false);
            }
        });

        return () => {
            subscriber(); // Unsubscribe on cleanup
        };
    }, [initializing]);

    useEffect(() => {
        if (initializing) {
            return;
        }

        const isAuthRoute = segments[0] === '(auth)';

        if (user && isAuthRoute) {
            router.replace('/(menu)');
        } else if (!user && !isAuthRoute) {
            router.replace('/(auth)/Login');
        } else {
        }
    }, [user, initializing, segments]);

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AppProvider>
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(menu)" options={{ headerShown: false }} />
            </Stack>
        </AppProvider>
    );
}
