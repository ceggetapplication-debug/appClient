import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Product, CartProductsTabProps } from './cart-types';
import { useAppTranslation } from '@/translations/data/translationCentralization';
import { TypeLivraison } from '../calculation-logic/calculLivraison';
import { Colors } from '@/constants/Colors';

type Props = CartProductsTabProps & {
  renderProductItem: (p: Product) => React.ReactNode;
};

export const CartProductsTab: React.FC<Props> = (props: Props) => {
  const { t } = useAppTranslation();
  const { products, totalCommand, MC, CC, fraisAppli, finalTotal, selectedDeliveryType, onDeliveryTypeSelect, onConfirmOrder, renderProductItem } = props;
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('prodsPann')}</Text>
        {products.map((product: Product) => renderProductItem(product))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('commandList.deliveryType')}</Text>
        <View style={styles.deliveryContainer}>
          {[TypeLivraison.Normal, TypeLivraison.Rapid, TypeLivraison.Pickup].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeButton, selectedDeliveryType === type && styles.typeButtonSelected]}
              onPress={() => onDeliveryTypeSelect(type)}
            >
              <Text style={selectedDeliveryType === type ? styles.textSelected : styles.textDefault}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text>{t('commandList.amount')}</Text>
          <Text>{totalCommand} DZD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{t('delivery_service_base_cost_label')}</Text>
          <Text>{MC} DZD</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>{t('app_fees_label')}</Text>
          <Text>{fraisAppli} DZD</Text>
        </View>
        {CC > 0 && (
          <View style={styles.summaryRow}>
            <Text>{t('reduction_total_produits_label')}</Text>
            <Text>-{CC} DZD</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t('totalFINAL')}</Text>
          <Text style={styles.totalValue}>{finalTotal} DZD</Text>
        </View>

        <TouchableOpacity style={styles.orderButton} onPress={onConfirmOrder}>
          <Text style={styles.orderButtonText}>{t('general.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 15
    },
    section: {
      marginBottom: 25
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      color: colors.text,
    },
    deliveryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    typeButton: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4
    },
    typeButtonSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    textDefault: {
      color: colors.textNormal,
    },
    textSelected: {
      color: colors.blond,
      fontWeight: 'bold',
    },
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 15,
      padding: 20,
      elevation: 5,
      marginBottom: 30
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.accent,
      paddingTop: 15,
      marginTop: 5
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold'
    },
    totalValue: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.tint,
    },
    orderButton: {
      backgroundColor: colors.icon,
      padding: 18,
      paddingHorizontal: 25,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginTop: 20,
      width: 'auto',
    },
    orderButtonText: {
      color: colors.tint,
      fontSize: 16,
      fontWeight: 'bold'
    }
  });
};
