import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import * as Location from 'expo-location';
import { account, databases, config, ID } from '../calculation-logic/appwriteConfig';
import { LocationObject } from 'expo-location';
import MapView, { Marker, Region, MapPressEvent, MarkerDragStartEndEvent } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTranslation } from '@/translations/data/translationCentralization';
import { uploadToR2 } from '../calculation-logic/imagesLogic';
import { Colors } from '@/constants/Colors';
import { useAgePhoneValidation } from '../calculation-logic/verifAgeNum';

interface LocationCoordinates {
  accuracy: number | null;
  heading: number | null;
  latitude: number;
  longitude: number;
}

const RegistrationForm = () => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [fullName, setFullName] = useState('');
  const [sexe, setSexe] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [suggestedAddressFromMap, setSuggestedAddressFromMap] = useState<string | null>(null);
  const [domicileType, setDomicileType] = useState<string | null>(null);
  const [customDomicileType, setCustomDomicileType] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [domicileNumber, setDomicileNumber] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const mapRef = useRef<MapView>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentMapRegion, setCurrentMapRegion] = useState<Region | null>(null);
  const [selectedPinLocation, setSelectedPinLocation] = useState<LocationCoordinates | null>(null);
  const [localisation_gps, setLocalisation_gps] = useState<LocationCoordinates | null>(null);

  const { birthDate,
    birthDateError,
    handleBirthDateChange,
    isBirthDateValid,
    phone,
    phoneError,
    handlePhoneChange,
    isPhoneValid } = useAgePhoneValidation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('consoleLogRef'), t('gpsScreen.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleMapOpen = async () => {
    setIsLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('consoleLogRef'),
        t('locationPermissionDenied')
      );
      setIsLoading(false);
      return;
    }
    let location: LocationObject = await Location.getCurrentPositionAsync({});
    const initialLocationForMap = localisation_gps || {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setSelectedPinLocation(initialLocationForMap);
    const regionToSet = {
      latitude: initialLocationForMap.latitude,
      longitude: initialLocationForMap.longitude,
      latitudeDelta: 0.00015,
      longitudeDelta: 0.00012,
    };

    setCurrentMapRegion(regionToSet);
    if (mapRef.current) {
      mapRef.current.animateToRegion(regionToSet, 0);
    }

    setShowMapModal(true);
    setIsLoading(false);
  };

  const isFormValidForSubmission = (): boolean => {
    let isValid = (
      !!fullName &&
      isBirthDateValid() &&
      isPhoneValid() &&
      !!sexe &&
      !!email &&
      !!password && password.length >= 8 &&
      localisation_gps !== null &&
      !!address &&
      !!imageUri &&
      !!domicileType &&
      !!domicileNumber &&
      !isLoading
    );
    if (domicileType === 'Appartement') {
      isValid = isValid && !!buildingName && !!floor;
    }
    if (domicileType === 'Autre') {
      isValid = isValid && !!customDomicileType;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!isFormValidForSubmission()) {
      const missingFields = [];
      if (!fullName) missingFields.push(t('nameLabel'));
      if (!birthDate || birthDate.length !== 10 || birthDateError) {
        missingFields.push(t('dobLabel') + (birthDateError ? ` (${birthDateError})` : ''));
      }
      if (!phone || phone.replace(/\D/g, '').length !== 10 || phoneError) missingFields.push(t('phoneLabel') + (phoneError ? ` (${phoneError})` : ''));
      if (!email) missingFields.push(t('emailLabel'));
      if (!password) missingFields.push(t('passwordLabel'));
      if (password.length < 8) missingFields.push(t('passwordLabel') + ` (${t('passwordNote')})`);
      if (!address) missingFields.push(t('commandList.address'));
      if (domicileType === 'Appartement') {
        if (!buildingName) missingFields.push(t('buildingNameLabel'));
        if (!floor) missingFields.push(t('floorLabel'));
      }
      if (!imageUri) missingFields.push(t('frontDoorPic'));
      let errorMessage = t('profileScreen.passwordFieldsRequired') + '\n\n' + missingFields.join('\n');
      if (localisation_gps === null) missingFields.push(t('tab.gps') + ` (${t('selectOnMap')})`);
      Alert.alert(t('formIncompleteTitle'), errorMessage);
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        fullName
      );

      await account.createEmailPasswordSession(email, password);
      await account.createVerification('cegget://verify-email');
      Alert.alert(t('general.success'), t('check_email_to_verify'));

      let doorPhotoId = null;
      if (imageUri && imageUri.startsWith('file')) {
        await uploadToR2(`portes/${newAccount.$id}.jpg`, {
          uri: imageUri,
          name: `${newAccount.$id}.jpg`,
          type: 'image/jpeg'
        });
      }

      await databases.createDocument(
        config.databaseId,
        config.usersCollectionId,
        newAccount.$id,
        {
          userId: newAccount.$id,
          pseudo: username || fullName,
          email: email,
          phoneNumber: phone,
          address: address,
          sexe: sexe,
          birthDate: birthDate,
          domicileType: domicileType === 'Autre' ? customDomicileType : domicileType,
          domicileNumber: domicileNumber,
          buildingName: buildingName || null,
          floor: floor || null,
          localisation_gps: JSON.stringify(localisation_gps),
          livraisonsGratuites: 0,
          registrationDate: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          doorPhotoId: doorPhotoId,
        }
      );


      Alert.alert(t('general.success'), t('registrationSuccess'));

    } catch (error) {
      console.error("Registration Error:", error);
      const errorMessage = t('genericError');
      setAuthError(errorMessage);
      Alert.alert(t('general.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMapLocation = async () => {
    setIsLoading(true);
    try {
      if (selectedPinLocation === null) {
        Alert.alert(t('general.attention'), t('noLocationSelected') || 'Aucun point sélectionné sur la carte.');
        setIsLoading(false);
        setShowMapModal(false);
        return;
      }

      setLocalisation_gps(selectedPinLocation);

      let geocodedAddress = await Location.reverseGeocodeAsync(selectedPinLocation);
      if (geocodedAddress && geocodedAddress.length > 0) {
        const firstResult = geocodedAddress[0];
        const fullAddressString = [
          firstResult.streetNumber, firstResult.street, firstResult.city,
          firstResult.region, firstResult.country, firstResult.postalCode,
        ].filter(Boolean).join(', ');
        setSuggestedAddressFromMap(fullAddressString);
        Alert.alert(t('general.success'), t('selectedAddressIs').replace('{0}', String(fullAddressString)));
      } else {
        const gpsFallback = `${selectedPinLocation.latitude.toFixed(5)}, ${selectedPinLocation.longitude.toFixed(5)}`;
        setSuggestedAddressFromMap(gpsFallback);
      }
    } catch (error) {
      console.error("Geocoding Error confirming location:", error);
      const gpsFallback = `${selectedPinLocation.latitude.toFixed(5)}, ${selectedPinLocation.longitude.toFixed(5)}`;
      setSuggestedAddressFromMap(gpsFallback);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('registerMySelf')}</Text>

        <Text style={styles.sidetitle}>{t('aboutYou')}</Text>

        <Text style={styles.label}>{t('nameLabel')}</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder={t('placeholderFullName')} editable={!isLoading} />

        <Text style={styles.label}>{t('labelUsername')}</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUserName} placeholder={t('placeholderUsername')} editable={!isLoading} />

        <Text style={styles.label}>{t('dobLabel')}</Text>
        <TextInput
          style={[styles.input, birthDateError ? styles.errorInput : null]}
          value={birthDate}
          onChangeText={handleBirthDateChange}
          keyboardType="numeric"
          placeholder={t('dobPlaceholder')}
          maxLength={10}
          editable={!isLoading}
        />
        {birthDateError ? <Text style={styles.error}>{birthDateError}</Text> : null}

        <Text style={styles.label}>{t('sexe')}</Text>
        <View style={styles.sexeSelectionContainer}>
          <TouchableOpacity
            style={[styles.sexeButton, sexe === 'femme' && styles.sexeButtonSelected]}
            onPress={() => setSexe('femme')}
            disabled={isLoading}
          >
            <Text style={[styles.sexeButtonText, sexe === 'femme' && styles.sexeButtonTextSelected]}>{t('womaaan') || 'Femme'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sexeButton, sexe === 'homme' && styles.sexeButtonSelected]}
            onPress={() => setSexe('homme')}
            disabled={isLoading}
          >
            <Text style={[styles.sexeButtonText, sexe === 'homme' && styles.sexeButtonTextSelected]}>{t('hoMaan') || 'Homme'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sidetitle}>{t('livraisonInfo')}</Text>
        <Text style={styles.label}>{t('commandList.address')}</Text>

        <Text style={styles.label}>{t('communeLabel')}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder={t('communePlaceholder')}
          editable={!isLoading}
        />
        <Text style={styles.label}>{t('villageLabel')}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder={t('villagePlaceholder')}
          editable={!isLoading}
        />

        <Text style={styles.label}>{t('domicileType')}</Text>
        <View>
          <TouchableOpacity
            style={[styles.homeButton, domicileType === 'Appartement' && styles.homeButtonSelected]}
            onPress={() => setDomicileType('Appartement')}
            disabled={isLoading}
          >
            <Ionicons
              name="business"
              size={24}
              color={domicileType === 'Appartement' ? colors.blond : colors.green}
              style={styles.iconSpacing}
            />
            <Text style={[styles.homeButtonText, domicileType === 'Appartement' && styles.homeButtonTextSelected]}>
              {t('appart') || 'Appartement'}
            </Text>
          </TouchableOpacity>
        </View>
        <View>

          <TouchableOpacity
            style={[styles.homeButton, domicileType === 'Maison' && styles.homeButtonSelected]}
            onPress={() => setDomicileType('Maison')}
            disabled={isLoading}
          >
            <Ionicons
              name="home"
              size={24}
              color={domicileType === 'Maison' ? colors.blond : colors.green}
              style={styles.iconSpacing}
            />
            <Text style={[styles.homeButtonText, domicileType === 'Maison' && styles.homeButtonTextSelected]}>
              {t('houseu') || 'Maison'}
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={[styles.homeButton, domicileType === 'Bureau' && styles.homeButtonSelected]}
            onPress={() => setDomicileType('Bureau')}
            disabled={isLoading}
          >
            <Ionicons
              name="briefcase"
              size={24}
              color={domicileType === 'Bureau' ? colors.blond : colors.green}
              style={styles.iconSpacing}
            />
            <Text style={[styles.homeButtonText, domicileType === 'Bureau' && styles.homeButtonTextSelected]}>
              {t('deskou') || 'Bureau'}
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity
            style={[styles.homeButton, domicileType === 'Autre' && styles.homeButtonSelected]}
            onPress={() => setDomicileType('Autre')}
            disabled={isLoading}
          >
            <Text style={[styles.homeButtonText, domicileType === 'Autre' && styles.homeButtonTextSelected]}>
              {t('otheur') || 'Autre'}
            </Text>
          </TouchableOpacity>
        </View>
        {domicileType === 'Appartement' && (
          <>
            <Text style={styles.label}>{t('buildingNameLabel') || 'Nom du bâtiment'}</Text>
            <TextInput
              style={styles.input}
              value={buildingName}
              onChangeText={setBuildingName}
              placeholder={t('placeholderBuildingName') || 'Nom du bâtiment'}
              editable={!isLoading}
            />
            <Text style={styles.label}>{t('floorLabel') || 'Étage'}</Text>
            <TextInput
              style={styles.input}
              value={floor}
              onChangeText={setFloor}
              placeholder={t('placeholderFloor')}
              editable={!isLoading}
            />
          </>
        )}
        {domicileType === 'Autre' && (
          <>
            <TextInput
              style={styles.input}
              value={customDomicileType}
              onChangeText={setCustomDomicileType}
              placeholder={t('enterOtherTypePlaceholder') || 'Entrez le type'}
              editable={!isLoading}
            />
          </>
        )}

        <Text style={styles.label}>{t('domicileNumber')}</Text>
        <TextInput
          style={styles.input}
          value={domicileNumber}
          onChangeText={setDomicileNumber}
          placeholder={('XX')}
          editable={!isLoading}
        />

        <Text style={styles.label}>{t('frontDoorPic')}</Text>
        <TouchableOpacity onPress={pickImage} style={styles.imageButton} disabled={isLoading}>
          <Text style={styles.imageButtonText}>
            {isLoading && imageUri ? <ActivityIndicator color={colors.accent} size="small" /> : t('importPhotoBtn')}
          </Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

        <Text style={styles.label}>{t('tab.gps')}:</Text>
        <Text style={styles.gpsCoordinatesText}>
          {localisation_gps ? `Lat: ${localisation_gps.latitude.toFixed(4)}, Lon: ${localisation_gps.longitude.toFixed(4)}` : t('no_gps_selected')}
        </Text>
        {suggestedAddressFromMap && (
          <Text style={styles.gpsSuggestedAddressText}>
            ({t('suggestedAddress')}: {suggestedAddressFromMap})
          </Text>
        )}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={handleMapOpen}
          disabled={isLoading}
        >
          <Text style={styles.mapButtonText}>{t('selectOnMap')}</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={false}
          visible={showMapModal}
          onRequestClose={() => setShowMapModal(false)}
        >
          <View style={styles.modalContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={true}
              rotateEnabled={true}
              showsUserLocation={true}

              initialRegion={currentMapRegion || undefined}
              onRegionChangeComplete={(region: Region) => {
                setCurrentMapRegion(region);
              }}
              onPress={(e: MapPressEvent) => {
                const coords = e.nativeEvent.coordinate;
                setSelectedPinLocation({
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  accuracy: null,
                  heading: null
                });
              }}
            >
              {selectedPinLocation && (
                <Marker
                  coordinate={selectedPinLocation}
                  pinColor="red"
                  draggable={true}
                  onDragEnd={(e: MarkerDragStartEndEvent) => {
                    const coords = e.nativeEvent.coordinate;
                    setSelectedPinLocation({
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      accuracy: null,
                      heading: null
                    });
                  }}
                />
              )}
            </MapView>


            <TouchableOpacity
              style={styles.confirmLocationButton}
              onPress={confirmMapLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.blond} />
              ) : (
                <Text style={styles.confirmLocationButtonText}>{t('general.confirm')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelMapButton}
              onPress={() => setShowMapModal(false)}
              disabled={isLoading}
            >
              <Text style={styles.cancelMapButtonText}>{t('general.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Text style={styles.sidetitle}>{t('connectionInfo')}</Text>

        <Text style={styles.label}>{t('phoneLabel')}</Text>
        <TextInput
          style={[styles.input, phoneError ? styles.errorInput : null]}
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="numeric"
          placeholder={'0XXXXXXXXX'}
          maxLength={10}
          editable={!isLoading}
        />
        {phoneError ? <Text style={styles.error}>{phoneError}</Text> : null}

        <Text style={styles.label}>{t('emailLabel')}</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder={t('profileScreen.newEmailPlaceholder')} autoCapitalize="none" editable={!isLoading} />

        <Text style={styles.label}>{t('profileScreen.password')}</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder={('**********')}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle} disabled={isLoading}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <Text style={styles.note}>{t('profileScreen.weakPasswordHint')}</Text>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitButton, (!isFormValidForSubmission() || isLoading) && styles.submitButtonDisabled]}
          disabled={!isFormValidForSubmission() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.blou} />
          ) : (
            <Text style={styles.submitButtonText}>{t('submitButton')} </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 60,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      marginTop: 20,
      alignSelf: 'auto',
      color: colors.text,
      textDecorationLine: 'underline',
      textDecorationColor: colors.green,
    },

    sidetitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 15,
      alignSelf: 'auto',
      textDecorationLine: 'underline'
    },
    mapButton: {
      backgroundColor: colors.tint,
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
      alignSelf: 'center',
      alignItems: 'center',
      width: 'auto',
    },
    mapButtonText: {
      color: colors.text,
      fontWeight: 'bold',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    map: {
      width: '100%',
      height: '60%',
      borderRadius: 5,
      borderColor: colors.tint,
      borderWidth: 2,
      marginBottom: 20,
    },
    confirmLocationButton: {
      backgroundColor: colors.text,
      padding: 15,
      borderRadius: 5,
      marginTop: 10,
      width: 'auto',
      alignItems: 'center',
    },
    confirmLocationButtonText: {
      color: colors.accent,
      fontWeight: 'bold',
      fontSize: 16,
    },
    cancelMapButton: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
      width: 'auto',
      alignItems: 'center',
    },
    cancelMapButtonText: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 14,
    },
    gpsCoordinatesText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 5,
      alignSelf: 'center',
    },
    gpsSuggestedAddressText: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
      marginTop: 10,
    },
    sexeSelectionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
    },
    sexeButton: {
      flex: 1,
      borderWidth: 2,
      borderColor: colors.tint,
      borderRadius: 2,
      paddingVertical: 10,
      marginHorizontal: 5,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    sexeButtonSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.icon,
    },
    sexeButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    sexeButtonTextSelected: {
      color: colors.blond,
    },
    homeButton: {
      flex: 1,
      borderWidth: 2,
      borderColor: colors.tint,
      borderRadius: 2,
      paddingVertical: 10,
      marginHorizontal: 5,
      alignItems: 'center',
      backgroundColor: colors.surface,
      width: '50%',
      alignSelf: 'center',
      marginTop: 5,
    },
    homeButtonSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.icon,
    },
    homeButtonText: {
      color: colors.text,
      fontWeight: '600',
    },
    homeButtonTextSelected: {
      color: colors.blond,
    },

    label: {
      fontWeight: '600',
      marginTop: 15,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.tint,
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 5,
      marginTop: 5,
      color: colors.textNormal,
    },
    errorInput: {
      borderColor: 'red',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.tint,
      backgroundColor: colors.surface,
      borderRadius: 2,
      marginTop: 5,
      paddingRight: 10,
    },
    passwordInput: {
      flex: 1,
      padding: 10,
      fontSize: 14,
      color: colors.textNormal,
    },
    passwordToggle: {
      padding: 5,
    },
    error: {
      color: colors.errorText,
      fontSize: 13,
      marginTop: 5,
    },
    imageButton: {
      backgroundColor: colors.blou,
      padding: 10,
      borderRadius: 2,
      marginTop: 10,
      width: 'auto',
      alignSelf: 'center',
      alignItems: 'center',
    },
    imageButtonText: {
      color: colors.blond,
      fontWeight: 'bold',
    },
    imagePreview: {
      width: 200,
      height: 280,
      marginTop: 10,
      alignSelf: 'center',
    },
    note: {
      marginTop: 20,
      fontSize: 12,
      fontStyle: 'italic',
      fontWeight: 600,
      color: colors.greyDes,
    },
    submitButton: {
      backgroundColor: colors.green,
      padding: 10,
      borderRadius: 4,
      marginTop: 30,
      width: 'auto',
      alignSelf: 'center',
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitButtonText: {
      color: colors.blond,
      fontWeight: 'bold',
      fontSize: 16,
    },
    iconSpacing: {
      marginRight: 8,
    },
  });
};

export default RegistrationForm;
