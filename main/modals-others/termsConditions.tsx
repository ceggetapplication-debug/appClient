import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { TERMS_TEXT } from '../../constants/termsConditions';
import { useAppTranslation } from '@/translations/data/translationCentralization';

interface TermsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const TermsModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const { t } = useAppTranslation();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const colors = Colors[theme];
    const styles = getStyles(theme);


    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.surface }]}>
                    <Text style={styles.headerTitle}>{t('termsAcceptance')}</Text>
                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close-outline" size={28} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.termsText}>
                        {TERMS_TEXT}
                    </Text>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                        <Ionicons name="checkmark-circle-outline" size={36} color={colors.tint} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const getStyles = (theme: 'light' | 'dark') => {
    const colors = Colors[theme];
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
        },
        closeIcon: {
            padding: 4,
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 20,
        },
        scrollContent: {
            paddingVertical: 16,
        },
        termsText: {
            fontSize: 14,
            lineHeight: 22,
        },
        footer: {
            padding: 16,
            borderTopWidth: 1,
        },
        iconButton: {
            padding: 8,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
};