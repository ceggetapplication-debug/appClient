import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Driver, TypeLivraison, ResultatFinalDeLivraison } from '../calculation-logic/calculLivraison';
import { useAppTranslation } from '@/translations/data/translationCentralization';
import QRgenerator from '../modals-others/QRgenerator';

interface Props {
  isOrderConfirmed: boolean;
  isOrderCancelled: boolean;
  deliveryStatusMessage: string;
  confirmedDeliveryType: TypeLivraison | null;
  currentDriver: Driver | null;
  externalDriverDistance: number | null;
  hasDeliveryArrived: boolean;
  isDriverAcceptedOrder: boolean;
  selectedRating: number;
  onCancelOrder: () => void;
  onOpenQR: () => void;
  onRatingSelect: (rating: number) => void;
  finalDeliveryCalculationResult: ResultatFinalDeLivraison | null;
  confirmedTReel: number;
  confirmedTotalCommand: number;
  confirmedAppliedCreditAmount: number;
}

export const DeliveryStatusTab: React.FC<Props> = (props: Props) => {
  const [isQRModalVisible, setIsQRModalVisible] = useState<boolean>(false);
  const { selectedRating, onRatingSelect, hasDeliveryArrived, isOrderCancelled, isOrderConfirmed, currentDriver, externalDriverDistance, confirmedDeliveryType, onCancelOrder, deliveryStatusMessage, finalDeliveryCalculationResult, confirmedTReel, confirmedTotalCommand, confirmedAppliedCreditAmount, onOpenQR, isDriverAcceptedOrder } = props;
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];

  const handleCancelOrder = () => {
    Alert.alert(
      t('cancel_order'),
      t('cancel_order_detailed'),
      [
        {
          text: t('general.cancel'),
          style: 'cancel',
        },
        {
          text: t('general.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (onCancelOrder) {
                await onCancelOrder();
              }
              Alert.alert(t('general.success'), t('order_cancelled_message'));
            } catch (error) {
              Alert.alert(t('general.error'), t('genericError'));
            }
          },
        },
      ]
    );
  };

  const renderHeartRating = (value: number) => (
    <TouchableOpacity key={value} onPress={() => onRatingSelect(value)}>
      <Ionicons
        name={selectedRating >= value ? "heart" : "heart-outline"}
        size={36}
        color={selectedRating >= value ? colors.tint : colors.green}
        style={{ marginHorizontal: 5 }}
      />
    </TouchableOpacity>
  );

  const MC = finalDeliveryCalculationResult?.MC ?? 0;
  const fraisAppli = finalDeliveryCalculationResult?.fraisAppli ?? 0;
  const totalFinal = confirmedTotalCommand + MC + fraisAppli - confirmedAppliedCreditAmount;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.deliveryStatusMessage}>{deliveryStatusMessage}</Text>

      <View style={styles.deliveryInfoLabels}>
        <Text style={styles.deliveryInfoText}>
          {t('libreurID')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && currentDriver
              ? currentDriver.id
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('livrourNameu')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && currentDriver
              ? currentDriver.name
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('distuLivDepChezTwa')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && externalDriverDistance !== null
              ? `${externalDriverDistance.toFixed(3)} km`
              : "/"}
          </Text>
        </Text>
        <Text style={styles.deliveryInfoText}>
          {t('tempusKaMisLeLIVLIV')}:{' '}
          <Text style={styles.deliveryInfoValue}>
            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && hasDeliveryArrived && confirmedTReel > 0
              ? `${confirmedTReel} ${t('minutis')}`
              : "/"}
          </Text>
        </Text>

        {hasDeliveryArrived && finalDeliveryCalculationResult && (
          <>
            {confirmedDeliveryType !== TypeLivraison.Pickup && (
              <Text style={styles.deliveryInfoText}>
                {t('payerLIVfinal')}:{' '}
                <Text style={styles.deliveryInfoValue}>{MC} DZD</Text>
              </Text>
            )}
            {fraisAppli > 0 && (
              <Text style={styles.deliveryInfoText}>
                {t('app_fees_label')}:{' '}
                <Text style={styles.deliveryInfoValue}>{fraisAppli} DZD</Text>
              </Text>
            )}
            {confirmedAppliedCreditAmount > 0 && (
              <Text style={styles.deliveryInfoText}>
                {t('credit_applied_label')}:{' '}
                <Text style={styles.deliveryInfoValue}>-{confirmedAppliedCreditAmount} DZD</Text>
              </Text>
            )}
            <View style={styles.finalTotalContainer}>
              <Text style={styles.totalText}>
                {t('totalFINAL')}: <Text style={styles.finalTotalValue}>{totalFinal} DZD</Text>
              </Text>
            </View>

            <QRgenerator
              orderData={{
                id: currentDriver?.id || '',
                orderReference: currentDriver?.id || '',
                fullName: currentDriver?.name || 'Client',
                address: '',
                date: new Date().toISOString()
              }}
              externalDriverDistance={externalDriverDistance}
              onSignatureCompleted={() => { }}
            />

            {(confirmedDeliveryType === TypeLivraison.Rapid || confirmedDeliveryType === TypeLivraison.Normal) && (
              <>
                <Text style={styles.deliveryLabel}>{t('noter_le_livreur')}</Text>
                <View style={styles.heartRatingContainer}>
                  {[1, 2, 3, 4, 5].map((value) => renderHeartRating(value))}
                </View>
              </>
            )}
          </>
        )}
      </View>
      {isOrderConfirmed && !isOrderCancelled && !hasDeliveryArrived && !isDriverAcceptedOrder && (
        <TouchableOpacity onPress={handleCancelOrder} style={styles.cancelOrderButton}>
          <Text style={styles.cancelOrderButtonText}>{t('cancel_order')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      padding: 20,
    },
    deliveryStatusMessage: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    deliveryInfoLabels: {
      backgroundColor: colors.surface,
      borderRadius: 5,
      padding: 16,
      elevation: 3,
      marginBottom: 20,
    },
    deliveryInfoText: {
      fontSize: 15,
      color: colors.text,
      marginBottom: 8,
    },
    deliveryInfoValue: {
      fontWeight: 'bold',
      color: colors.tint,
    },
    deliveryLabel: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    heartRatingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    finalTotalContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.accent,
      paddingTop: 12,
      marginTop: 12,
    },
    totalText: {
      fontSize: 16,
      color: colors.text,
    },
    finalTotalValue: {
      fontWeight: 'bold',
      color: colors.tint,
      fontSize: 18,
    },
    cancelOrderButton: {
      alignSelf: 'center',
      marginTop: 20,
      padding: 10,
    },
    cancelOrderButtonText: {
      color: colors.textNormal,
      textDecorationLine: 'underline',
      fontSize: 14,
    },
    qrButton: {
      flexDirection: 'row',
      backgroundColor: colors.text,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
      alignSelf: 'center',
    },
    qrButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: 'bold',
    },
    qrModalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    qrModalCloseButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      zIndex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
    },
  });
};
