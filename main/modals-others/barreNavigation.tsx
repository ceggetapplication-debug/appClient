import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';


const BarreNavigation = ({ activeTab = 'home' }) => {
    const tabs = [
        { id: 'home', icon: 'home-outline', activeIcon: 'home' },
        { id: 'search', icon: 'search-outline', activeIcon: 'search' },
        { id: 'heart', icon: 'heart-outline', activeIcon: 'heart' },
        { id: 'cart', icon: 'cart-outline', activeIcon: 'cart' },
        { id: 'person', icon: 'person-outline', activeIcon: 'person' },
    ];

    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const styles = getStyles(theme);
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                    <TouchableOpacity style={styles.tab}>
                        <Ionicons
                            name={activeTab === tab.id ? tab.activeIcon : tab.icon}
                            size={24}
                            color={activeTab === tab.id ? colors.tint : colors.icon}
                        />
                    </TouchableOpacity>
                    {index < tabs.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
            ))}
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => {
    const colors = Colors[theme];
    return StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 25,
            left: 20,
            right: 20,
            height: 50,
            backgroundColor: colors.tabIconDefault,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderRadius: 30,
            overflow: 'hidden',
            borderWidth: 0,
            elevation: 8,
            shadowColor: colors.noir,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        tab: {
            flex: 1,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        separator: {
            width: 1,
            height: 20,
            backgroundColor: colors.globeu,
        },
    });
};

export default BarreNavigation;
