import { Stack } from 'expo-router';
import Colors from '../../constants/Colors';
import i18n from '../../languages/i18n';

const Page = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" options={{ title: i18n.t('authLayoutScreen.login'), headerTitleAlign: 'center' }} />
            <Stack.Screen
                name="Signup"
                options={{
                    title: i18n.t('authLayoutScreen.sign_up'),
                    headerShown: true,
                    headerTitleAlign: 'center',
                    headerStyle: {
                        backgroundColor: '#2B2B2B',
                    },
                    headerTintColor: Colors.green,
                }}
            />
            <Stack.Screen
                name="ForgotPassword"
                options={{
                    title: i18n.t('authLayoutScreen.forgot_password'),
                    headerTitleAlign: 'center',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#2B2B2B' },
                    headerTintColor: Colors.green,
                }}
            />
        </Stack>
    );
};

export default Page;
