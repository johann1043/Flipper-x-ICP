import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import Colors from '../../../constants/Colors';
import i18n from '../../../languages/i18n';
import { WebSocketProvider } from '../../../context/WebSocketContext';
import { useAppContext } from '../../../context/GroupContext';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
    MaterialTopTabNavigationOptions & { href?: any },
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    MaterialTopTabNavigationEventMap
>(Navigator);

const TabLayout = () => {
    
    const { data } = useAppContext();

    return (
        <WebSocketProvider groupId={data?.groupId ?? ''}>
            <MaterialTopTabs
                screenOptions={{
                    tabBarActiveTintColor: '#131620',
                    tabBarLabelStyle: { fontSize: 14, textTransform: 'capitalize', fontWeight: 'bold' },
                    tabBarIndicatorStyle: { backgroundColor: Colors.darkGreen, height: 3 },
                }}
            >
                <MaterialTopTabs.Screen
                    name="GroupChat"
                    options={{ title: i18n.t('tabsLayout.chat') }}
                />
                <MaterialTopTabs.Screen
                    name="MyChallenges"
                    options={{ title: i18n.t('tabsLayout.myChallenges') }}
                />
                <MaterialTopTabs.Screen
                    name="HotList"
                    options={{ title: i18n.t('tabsLayout.hotList') }}
                />
                
            </MaterialTopTabs>
        </WebSocketProvider>
    );
};

export default TabLayout;
