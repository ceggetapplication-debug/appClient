import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { databases, config } from '../calculation-logic/appwriteConfig';
import { Colors } from '@/constants/Colors';
import { useAppTranslation } from '@/translations/data/translationCentralization';

export interface Order {
  id: string;
  orderReference: string;
  fullName: string;
  address: string;
  date: string;
}

export interface QRSignature {
  qrId: string;
  orderId: string;
  token: string;
  isValid: boolean;
  createdAt: number;
  usedAt?: number;
}

interface QRGeneratorProps {
  orderData: Order;
  externalDriverDistance: number | null;
  onSignatureCompleted?: () => void;
}


const QRgenerator: React.FC<QRGeneratorProps> = ({ orderData, externalDriverDistance, onSignatureCompleted }: QRGeneratorProps) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [qrSignature, setQrSignature] = useState<QRSignature | null>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [signatureHistory, setSignatureHistory] = useState<QRSignature[]>([]);

  const generateQRCode = async () => {
    const orderIdToUse = orderData.orderReference || orderData.id || `temp-${Date.now()}`;
    const qrId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = btoa(
      JSON.stringify({
        qrId,
        orderId: orderIdToUse,
        timestamp: Date.now(),
      })
    );

    const newQR: QRSignature = {
      qrId,
      orderId: orderIdToUse,
      token,
      isValid: true,
      createdAt: Date.now(),
    };

    setQrSignature(newQR);
    setSignatureHistory((prev: QRSignature[]) => [...prev, newQR]);
    setScanResult('');

    await databases.createDocument(
      config.databaseId,
      'signatures',
      qrId,
      newQR
    ).catch((err: any) => {
      console.error('Erreur sauvegarde signature:', err);
    });
    if (onSignatureCompleted) onSignatureCompleted();
  };

  useEffect(() => {
    if (externalDriverDistance !== null && externalDriverDistance <= 0.005 && !qrSignature) {
      generateQRCode();
    }
  }, [externalDriverDistance]);
  if (externalDriverDistance === null || externalDriverDistance > 0.005) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={styles.statusBar.barStyle} backgroundColor={styles.statusBar.backgroundColor} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('signatureSQR')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name={styles.iconPackage.name} size={styles.iconPackage.size} color={styles.iconPackage.color} />
            <Text style={styles.cardTitle}>{t('anwaIyughen')}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconDocument.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('commandList.reference')}</Text> <Text style={styles.infoValue}>{orderData.orderReference}</Text>
            </View>

          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconPerson.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('commandList.by')}</Text> <Text style={styles.infoValue}>{orderData.fullName}</Text>
            </View>


            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Icon name="location-sharp" size={styles.iconPerson.size} color={styles.iconPerson.color} />
                <Text style={styles.infoLabel}>{t('commandList.address')}</Text> <Text style={styles.infoValue}>{orderData.address}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconCalendar.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('meymiDate')}</Text>: <Text style={styles.infoValue}>{orderData.date}</Text>
            </View>

          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name={styles.iconQr.name} size={styles.iconQr.size} color={styles.iconQr.color} />
            <Text style={styles.cardTitle}>{t('qrUstenyi')}</Text>
          </View>

          <View style={styles.qrContainer}>
            {qrSignature && qrSignature.isValid && (
              <QRCode
                value={qrSignature.token}
                size={styles.qrCode.size}
                backgroundColor={styles.qrCode.backgroundColor}
                color={styles.qrCode.colorValid}
              />
            )}
          </View>
          <View style={qrSignature?.isValid ? styles.statusValid : styles.statusInvalid}>
            <Icon
              name={qrSignature?.isValid ? styles.iconCheckCircle.name : styles.iconCloseCircle.name}
              size={styles.iconCheckCircle.size}
              color={qrSignature?.isValid ? styles.iconCheckCircle.color : styles.iconCloseCircle.color}
            />
            <Text style={qrSignature?.isValid ? styles.statusTextValid : styles.statusTextInvalid}>
              {qrSignature?.isValid ? t('qr.validCode') : t('qr.usedCode')}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonGenerate}
              onPress={generateQRCode}
            >
              <Icon name={styles.iconRefresh.name} size={styles.iconRefresh.size} color={styles.iconRefresh.color} />
              <Text style={styles.buttonTextGenerate}>{t('QRajdid')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    statusBar: {
      barStyle: 'dark-content' as const,
      backgroundColor: colors.surface,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 10,
      marginBottom: 5,
      borderRadius: 5,
      padding: 16,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textDecorationLine: 'underline',
      textDecorationColor: colors.tint,
      marginLeft: 8,
      textDecorationThickness: 2,
    },
    infoRow: {
      marginBottom: 5,
    },
    infoLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    infoLabel: {
      fontSize: 15,
      color: colors.textNormal,
      fontWeight: 500,
      marginLeft: 6,
    },
    infoValue: {
      fontSize: 14,
      color: colors.greyDes,
      marginLeft: 6,
    },
    qrContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      marginBottom: 10,
    },
    qrCode: {
      size: 200,
      backgroundColor: colors.blond,
      colorValid: colors.noir,
      colorInvalid: colors.azuvagh,
    },
    statusValid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      maxPaddingHorizontal: 15,
      backgroundColor: colors.green,
      borderRadius: 5,
      marginBottom: 16,
      alignSelf: 'center',
      width: 'fit-content',
    },
    statusInvalid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      maxPaddingHorizontal: 15,
      backgroundColor: colors.azuvagh,
      borderRadius: 5,
      marginBottom: 16,
      alignSelf: 'center',
      width: 'fit-content',
    },
    statusTextValid: {
      fontSize: 15,
      fontWeight: 500,
      color: colors.blond,
      marginLeft: 8,
    },
    statusTextInvalid: {
      fontSize: 15,
      fontWeight: 500,
      color: colors.blond,
      marginLeft: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    buttonGenerate: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.blou,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 5,
      alignSelf: 'center',
      minWidth: 0,
      maxWidth: '70%',
      marginHorizontal: 'auto',
    },
    buttonTextGenerate: {
      color: colors.blond,
      fontSize: 15,
      fontWeight: 500,
      marginLeft: 8,
    },
    iconPackage: {
      name: 'cube-outline',
      size: 24,
      color: colors.tint,
    },
    iconDocument: {
      name: 'document-text-outline',
      size: 18,
      color: colors.icon,
    },
    iconPerson: {
      name: 'person-outline',
      size: 18,
      color: colors.icon,
    },
    iconCalendar: {
      name: 'calendar-outline',
      size: 18,
      color: colors.icon,
    },
    iconQr: {
      name: 'qr-code-outline',
      size: 24,
      color: colors.tint,
    },
    iconCheckCircle: {
      name: 'checkmark-circle',
      size: 24,
      color: colors.blond,
    },
    iconCloseCircle: {
      name: 'close-circle',
      size: 24,
      color: colors.blond,
    },
    iconRefresh: {
      name: 'refresh-outline',
      size: 20,
      color: colors.blond,
    },
  });
};

export default QRgenerator;
