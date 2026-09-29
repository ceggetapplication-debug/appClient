import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icons from "@expo/vector-icons/MaterialIcons";

export const Header = () => {
    const { colors } = useTheme();

    return (
        <View style={{ paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: colors.text }} numberOfLines={1}>
                    Azul 👋
                </Text>
                <Text style={{ color: colors.text, opacity: 0.75 }} numberOfLines={1}>
                    Découvrir les produits
                </Text>
            </View>
            <TouchableOpacity style={{ width: 52, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 52, borderWidth: 1, borderColor: colors.border }}>
                <Icons name="notifications" size={24} color={colors.text} />
            </TouchableOpacity>
        </View>
    );
};