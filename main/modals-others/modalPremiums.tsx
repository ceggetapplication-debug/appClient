import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, GestureResponderEvent, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '@/constants/Colors';
import { account, databases, ID, config } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '@/translations/data/translationCentralization';

interface PremiumOffersModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgradePress: (offer: SelectedOfferDetails) => void;
}

interface SelectedOfferDetails {
  type: 'advantage' | 'subscription';
  label: string;
  value?: number;
  months?: number;
  price: number;
  confirmationTitle: string;
  confirmationBody: string;
}

const PremiumUtiliOffersModal = ({ isVisible, onClose, onUpgradePress }: PremiumOffersModalProps) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(false);
  const [infoModalContent, setInfoModalContent] = useState<string>('');
  const [currentView, setCurrentView] = useState<'offers' | 'confirmation' | 'thankYou'>('offers');
  const [selectedOffer, setSelectedOffer] = useState<SelectedOfferDetails | null>(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentView('offers');
      setSelectedOffer(null);
      setErrorStatus(null);
      setIsInfoModalVisible(false);
      setInfoModalContent('');
    }
  }, [isVisible]);

  const APPWRITE_FUNCTION_URL = 'YOUR_APPWRITE_FUNCTION_URL';
  const APPWRITE_FUNCTION_API_KEY = 'YOUR_APPWRITE_FUNCTION_API_KEY';

  const sendAdminNotification = async (offer: SelectedOfferDetails) => {
    try {
      const user = await account.get();
      const userId = user.$id;
      const userEmail = user.email;
      const response = await fetch(APPWRITE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Function-Key': APPWRITE_FUNCTION_API_KEY,
        },
        body: JSON.stringify({
          userId: userId,
          userEmail: userEmail,
          offerDetails: offer,
          requestTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send admin notification via Appwrite Function');
      }

      const result = await response.json();
      return { success: result.success, message: result.message };

    } catch (error: any) {
      console.error('Appwrite Error in sendAdminNotification:', error);
      if (error?.code === 401 || error?.type === 'user_unauthorized') {
        return { success: false, error: "Authentication required or unauthorized." };
      }
      return { success: false, error: error.message || 'An unknown Appwrite error occurred.' };
    }
  };

  const handleAdvantagesOptionPress = (optionLabel: string, price: number) => {
    let confTitle = '';
    let confBody = '';

    if (optionLabel === 'credit_cumule') {
      confTitle = t('ccLabel');
      confBody = t('infosCCPremUtili').replace('{{price}}', String(price));
    } else if (optionLabel === 'free_delivery') {
      confTitle = t('free_delivery_title_modal');
      confBody = t('infosLivGratPremUtili').replace('{{price}}', String(price));
    }

    const offerDetails: SelectedOfferDetails = {
      type: 'advantage',
      label: optionLabel,
      price: price,
      confirmationTitle: confTitle,
      confirmationBody: confBody
    };
    setSelectedOffer(offerDetails);
    setCurrentView('confirmation');
  };

  {/*const handleMonthlyOptionPress = (months: number, price: number) => {
    let confTitle = '';
    let confBody = '';

    if (months === 1) {
      confTitle = `1 ${t('month')}`;
      confBody = t('infosmoisPremUtili', { price: price });
    } else if (months === 6) {
      confTitle = `6 ${t('months')}`;
      confBody = t('infosmoisPremUtili', { price: price, months: 6 });
    } else if (months === 12) {
      confTitle = `12 ${t('months')}`;
      confBody = t('infosmoisPremUtili', { price: price, months: 12 });
    }

    const offerDetails: SelectedOfferDetails = {
      type: 'subscription',
      label: `${months}${t('month')}${months > 1 ? 's' : ''}`,
      months: months,
      price: price,
      confirmationTitle: confTitle, 
      confirmationBody: confBody    
    };
    setSelectedOffer(offerDetails);
    setCurrentView('confirmation');
  };*/}

  const handleInfoIconPress = (event: GestureResponderEvent, content: string) => {
    event.stopPropagation();
    setInfoModalContent(content);
    setIsInfoModalVisible(true);
  };

  const handleConfirmCashPayment = async () => {
    if (!selectedOffer) return;

    setErrorStatus(null);
    try {
      const user = await account.get();
      const userId = user.$id;
      const userEmail = user.email;

      const result = await sendAdminNotification(selectedOffer);

      if (result.success) {
        await databases.createDocument(
          config.databaseId,
          config.premiumCollectionId,
          ID.unique(),

          {
            userId: userId,
            userEmail: userEmail,
            offerType: selectedOffer.type,
            offerLabel: selectedOffer.label,
            offerPrice: selectedOffer.price,
            purchaseDate: new Date().toISOString(),
          }
        );

        setCurrentView('thankYou');
        onUpgradePress(selectedOffer);
      } else {
        setErrorStatus(`${t('general.error')} : ${result.error || t('error.unknown_occurred')}`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la confirmation ou de l\'enregistrement DB:', error);
      setErrorStatus(`${t('general.error')} : ${error.message || t('error.unknown_occurred')}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenOverlay}>
        {currentView === 'offers' && (
          <View style={styles.premiumModalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Icon name="close-circle" size={30} color={colors.greyDes} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('view_premium_offers')}</Text>
            </View>

            <ScrollView style={styles.scrollViewContent}>
              <Text style={styles.generalInfoText}>
                {t('textePresentationPremium')}
              </Text>
              {errorStatus && <Text style={styles.generalInfoText}>{errorStatus}</Text>}
              <Text style={styles.groupCtaText}>
                {t('avantagePremium')}
              </Text>
              <View style={styles.buttonGroup}>

                <TouchableOpacity
                  style={styles.advantageButton}
                  onPress={() => handleAdvantagesOptionPress(t('ccLabel'), 500)}
                >
                  <TouchableOpacity
                    style={styles.infoIconContainer}
                    onPress={(event: GestureResponderEvent) => handleInfoIconPress(event, t('infosCCPremUtili'))}>
                    <Icon name="information-outline" size={18} color={colors.blond} />
                  </TouchableOpacity>
                  <View style={styles.buttonContent}>
                    <Icon name="cash" size={40} color={colors.tint} style={styles.buttonImagePlaceholder} />
                    <Text style={styles.largeButtonLabel}>{t('ccLabel')}</Text>
                    <Text style={styles.buttonPrice}>500</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.advantageButton}
                  onPress={() => handleAdvantagesOptionPress(t('free_delivery_title_modal'), 800)}
                >
                  <TouchableOpacity
                    style={styles.infoIconContainer}
                    onPress={(event: GestureResponderEvent) => handleInfoIconPress(event, t('infosLivGratPremUtili'))}>
                    <Icon name="information-outline" size={18} color={colors.blond} />
                  </TouchableOpacity>
                  <View style={styles.buttonContent}>
                    <Icon name="motorbike" size={40} color={colors.green} style={styles.buttonImagePlaceholder} />
                    <Text style={styles.largeButtonLabel}>{t('free_delivery_title_modal')}</Text>
                    <Text style={styles.buttonPrice}>800</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/*<Text style={styles.groupCtaText}>
              {t('premiumMoisLabelUtili')}
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.dealButton}
                onPress={() => handleMonthlyOptionPress(1, 300)}
              >
                <TouchableOpacity
                style={styles.infoIconContainerSmall} 
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
              </TouchableOpacity>
                <View style={styles.buttonContentSmall}>
                  <View style={styles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={styles.singleBonusImage}
                  />
                  </View>
                  <Text style={styles.largeButtonLabel}>1{t('month')}</Text>
                  <Text style={styles.buttonPrice}>300</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dealButton}
                onPress={() => handleMonthlyOptionPress(6, 1300)}
              >
                <TouchableOpacity
                style={styles.infoIconContainerSmall}
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
              </TouchableOpacity>
                <View style={styles.buttonContentSmall}>
                  <View style={styles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={styles.singleBonusImage}
                  />
                  </View>
                  <Text style={styles.largeButtonLabel}>6{t('months')}</Text>
                  <Text style={styles.buttonPrice}>1300</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dealButton}
                onPress={() => handleMonthlyOptionPress(12, 3000)}
              >
                <TouchableOpacity
                style={styles.infoIconContainerSmall} 
                onPress={(event) => handleInfoIconPress(event,
                  t('infosmoisPremUtili')
                )}>
                <Icon name="information-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <View style={styles.buttonContentSmall}>
                  <View style={styles.multiIconContainer}>
                    <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRW5xjdMDNCOC1PR6_eNxqnb8EOVuVgJ7erxg&s' }}
                    style={styles.singleBonusImage}
                  />
                  </View>
                  <Text style={styles.largeButtonLabel}>12 {t('months')}</Text>
                  <Text style={styles.buttonPrice}>3000</Text>
                </View>
              </TouchableOpacity>
              </View>*/}
            </ScrollView>
          </View>
        )}

        {currentView === 'confirmation' && selectedOffer && (
          <View style={styles.infoOverlay}>
            <View style={styles.infoModalContainer}>
              <TouchableOpacity onPress={() => setCurrentView('offers')} style={styles.infoModalCloseButton}>
                <Icon name="close" size={24} color={colors.greyDes} />
              </TouchableOpacity>
              <ScrollView contentContainerStyle={styles.buttonContent}>
                <Text style={styles.groupCtaText}>{selectedOffer.confirmationTitle}</Text>
                <Text style={styles.generalInfoText}>{selectedOffer.confirmationBody}</Text>

                <TouchableOpacity style={styles.dealButton} onPress={handleConfirmCashPayment}>
                  <Text style={styles.largeButtonLabel}>{t('general.confirm')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.advantageButton} onPress={() => setCurrentView('offers')}>
                  <Text style={styles.largeButtonLabel}>{t('general.cancel')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {currentView === 'thankYou' && (
          <View style={styles.infoOverlay}>
            <View style={styles.infoModalContainer}>
              <TouchableOpacity onPress={onClose} style={styles.infoModalCloseButton}>
                <Icon name="close" size={24} color={colors.greyDes} />
              </TouchableOpacity>
              <ScrollView contentContainerStyle={styles.buttonContent}>
                <Icon name="check-circle-outline" size={80} color={colors.green} />
                <Text style={styles.modalTitle}>{t('thankYouForChoice')}</Text>
                <Text style={styles.generalInfoText}>
                  {t('weWillContactYouForPayment').replace('{{offer}}', selectedOffer?.label || '')}
                </Text>
                <TouchableOpacity style={styles.dealButton} onPress={onClose}>
                  <Text style={styles.largeButtonLabel}>OK</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}


        {isInfoModalVisible && (
          <View style={styles.infoOverlay} pointerEvents="box-none">
            <View style={styles.infoModalContainer}>
              <TouchableOpacity
                onPress={() => setIsInfoModalVisible(false)}
                style={styles.infoModalCloseButton}>
                <Icon name="close" size={24} color={colors.greyDes} />
              </TouchableOpacity>
              <ScrollView>
                <Text style={styles.infoModalText}>
                  {infoModalContent}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    infoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.noir,
      zIndex: 5,
    },
    infoModalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingTop: 35,
      marginTop: 0,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      flex: 1,
    },
    infoModalText: {
      fontSize: 16,
      color: colors.greyDes,
      textAlign: 'left',
      marginBottom: 30,
      marginLeft: 25,
      marginRight: 25,
    },
    infoModalCloseButton: {
      position: 'absolute',
      top: 5,
      right: 10,
      padding: 0,
    },
    singleBonusImage: {
      width: 60,
      height: 60,
      resizeMode: 'contain',
      marginBottom: 0,
      marginTop: 20,
    },
    multiIconContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
      width: '100%',
    },
    fullScreenOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    premiumModalView: {
      flex: 1,
      backgroundColor: 'white',
      paddingHorizontal: 0,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      marginBottom: 0,
      position: 'relative',
    },
    modalCloseButton: {
      position: 'absolute',
      left: 0,
      padding: 2,
      marginBottom: 10,
      marginTop: 0,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.greyDes,
      textAlign: 'center',
      flex: 1,
      marginTop: 30,
    },
    scrollViewContent: {
      paddingHorizontal: 5,
    },
    generalInfoText: {
      fontSize: 16,
      color: colors.greyDes,
      marginBottom: 20,
      textAlign: 'center',
    },
    groupCtaText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.greyDes,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 12,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 15,
      paddingHorizontal: 0,
    },
    advantageButton: {
      backgroundColor: colors.surface,
      paddingVertical: 2,
      paddingHorizontal: 2,
      borderRadius: 8,
      marginHorizontal: 2,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 160,
      position: 'relative',
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
    },
    buttonContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeButtonLabel: {
      color: colors.blond,
      fontSize: 17,
      fontWeight: 'bold',
      marginTop: -10,
      textAlign: 'center',
    },
    buttonPrice: {
      color: colors.blond,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 2,
      textAlign: 'center',
    },
    buttonImagePlaceholder: {
      marginBottom: 5,
    },
    infoIconContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.greyDes,
      borderRadius: 15,
      padding: 3,
    },
    dealButton: {
      backgroundColor: colors.green,
      paddingVertical: 2,
      paddingHorizontal: 2,
      borderRadius: 8,
      marginHorizontal: 2,
      flex: 1.5,
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 180,
      position: 'relative',
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    infoIconContainerSmall: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: colors.greyDes,
      borderRadius: 12,
      padding: 0,
    },
    buttonContentSmall: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      flex: 1,
    },
  });
};

export default PremiumUtiliOffersModal;
