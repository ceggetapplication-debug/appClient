import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from './modalMagasinInfos';
import { Colors } from '@/constants/Colors';
import { databases, config, ID } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '@/translations/data/translationCentralization';

interface ModalOrderQuantityProps {
    visible: boolean;
    onClose: () => void;
    product: Product | null;
    userId: string;
    onConfirm?: (orderData: Product & { quantity: number; totalPrice: string }) => void;
}

const ModalOrderQuantity: React.FC<ModalOrderQuantityProps> = ({
    visible,
    onClose,
    product,
    onConfirm,
    userId
}: ModalOrderQuantityProps) => {
    const { t } = useAppTranslation();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const styles = getStyles(theme);
    const colors = Colors[theme];
    const isUnit = product?.productType?.name === 'unit' || product?.productType?.id === 'unit';
    const pricePerKg = product?.quantity_unit_dzd_per_kg || 0;
    const unitPrice = product?.prix || 0;
    const unitWeight = product?.valeurQuantite ? `${product.valeurQuantite} ${product.uniteQuantite || ''}` : '';

    const [inputValue, setInputValue] = useState(isUnit ? "1" : "100");
    const numericValue = parseInt(inputValue) || 0;

    const handleIncrement = () => {
        if (isUnit) {
            setInputValue(String(numericValue + 1));
        } else {
            const step = numericValue >= 1000 ? 500 : 50;
            setInputValue(String(numericValue + step));
        }
    };

    const handleDecrement = () => {
        if (isUnit) {
            if (numericValue > 1) setInputValue(String(numericValue - 1));
        } else {
            const step = numericValue > 1000 ? 500 : 50;
            if (numericValue > 50) setInputValue(String(numericValue - step));
        }
    };

    const formatQuantityDisplay = () => {
        if (isUnit) {
            return `${numericValue} unité${numericValue > 1 ? 's' : ''}${unitWeight ? ` — ${unitWeight}` : ''}`;
        } else {
            if (numericValue >= 1000) {
                const kg = numericValue / 1000;
                return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
            }
            return `${numericValue} g`;
        }
    };

    const calculatePrice = () => {
        if (isUnit) {
            return (numericValue * unitPrice).toFixed(2);
        } else {
            return ((numericValue / 1000) * pricePerKg).toFixed(2);
        }
    };

    const handleOrder = async () => {
        if (!product) return;

        if (numericValue <= 0) {
            Alert.alert(t('general.error'), t('montantCCinvalide'));
            return;
        }

        try {
            await databases.createDocument(
                config.databaseId,
                config.ordersCollectionId,
                ID.unique(),
                {
                    userId: userId,
                    productId: product.id,
                    nom: product.name,
                    prix: parseFloat(calculatePrice()),
                    quantite: numericValue,
                    storeId: "boutique_inconnue"
                }
            );

            Alert.alert(t('general.success'), t('product_added_successfully'));
            if (onConfirm) onConfirm({ ...product, quantity: numericValue, totalPrice: calculatePrice() });
            onClose();

        } catch (error) {
            console.error("Erreur Appwrite:", error);
            Alert.alert(t('general.error'), "Erreur lors de l'ajout au panier");
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                            <Ionicons name="chevron-back" size={24} color={colors.icon} />
                        </TouchableOpacity>
                        <Text style={styles.title} numberOfLines={1}>{t('add_to_cart_title')}</Text>
                    </View>

                    <Text style={styles.title}>{t('add_to_cart_title')}</Text>
                    <Text style={styles.question}>{t('add_to_cart_message')}</Text>

                    <View style={styles.selectorContainer}>
                        <TouchableOpacity style={styles.sideBtn} onPress={handleDecrement}>
                            <Ionicons name="remove" size={24} color={colors.blond} />
                        </TouchableOpacity>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={inputValue}
                                onChangeText={setInputValue}
                                keyboardType="numeric"
                                selectTextOnFocus={true}
                            />
                        </View>

                        <TouchableOpacity style={styles.sideBtn} onPress={handleIncrement}>
                            <Ionicons name="add" size={24} color={colors.blond} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.formattedText}>{formatQuantityDisplay()}</Text>

                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>{t('commandsMgz.unitPriceLabel')}</Text>
                        <Text style={styles.priceValue}>{calculatePrice()} {t('commandList.currency')}</Text>
                    </View>

                    <TouchableOpacity style={styles.commandBtn} onPress={handleOrder}>
                        <Text style={styles.commandText}>{t('add_to_cart_title')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (theme: 'light' | 'dark') => {
    const colors = Colors[theme];
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: colors.noir,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContainer: {
            width: '100%',
            backgroundColor: colors.background,
            borderRadius: 45,
            padding: 25,
            alignItems: 'center',
        },
        headerRow: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
            marginBottom: 15,
        },
        backBtn: {
            width: 40,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: {
            fontSize: 18,
            fontWeight: '800',
            color: colors.green,
            flex: 1,
        },
        question: {
            fontSize: 15,
            color: colors.textNormal,
            textAlign: 'center',
            marginBottom: 25,
            fontWeight: '600',
            lineHeight: 20,
        },
        selectorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        sideBtn: {
            width: 50,
            height: 50,
            borderRadius: 15,
            backgroundColor: colors.greyDes,
            alignItems: 'center',
            justifyContent: 'center',
        },
        inputWrapper: {
            marginHorizontal: 15,
            width: 100,
            height: 50,
            backgroundColor: colors.surface,
            borderRadius: 15,
            borderWidth: 1.5,
            borderColor: colors.blond,
        },
        input: {
            flex: 1,
            fontSize: 18,
            fontWeight: '700',
            color: colors.textNormal,
            textAlign: 'center',
        },
        formattedText: {
            fontSize: 15,
            color: colors.textNormal,
            fontWeight: '700',
            marginBottom: 25,
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            marginBottom: 35,
        },
        priceLabel: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.text,
            marginRight: 10,
        },
        priceValue: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.tint,
        },
        commandBtn: {
            backgroundColor: colors.tint,
            width: 'auto',
            paddingHorizontal: 15,
            height: 50,
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.tint,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 10,
        },
        commandText: {
            color: colors.blond,
            fontSize: 18,
            fontWeight: '700',
        },
    });
};

export default ModalOrderQuantity;
