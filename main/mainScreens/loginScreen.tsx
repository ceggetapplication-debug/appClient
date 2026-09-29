import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { account } from './appwriteConfig';
import ForgotPasswordModal from '../modals-others/modalChangeResetPassword';
import { useRouter } from 'expo-router';
import { Models, AppwriteException } from 'react-native-appwrite';
import { getAppLogo } from '../calculation-logic/imagesLogic';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { PALETTE } from '@/constants/Colors';
const LoginScreen = () => {
  const { t, currentLang, setLanguage } = useAppTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [userDisabled, setUserDisabled] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

  const router = useRouter();

  const toggleLang = () => {
    const nextLang = currentLang === 'kab' ? 'fr' : 'kab';
    setLanguage(nextLang);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') return;

    setInvalidEmail(false);
    setWrongPassword(false);
    setAccountNotFound(false);
    setUserDisabled(false);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setInvalidEmail(true);
      return;
    }

    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error) {
      if ((error as AppwriteException).code === 401) {
        setWrongPassword(true);
      } else if ((error as AppwriteException).code === 404) {
        setAccountNotFound(true);
      } else if ((error as AppwriteException).code === 403) {
        setUserDisabled(true);
      } else {
        console.log("Erreur inattendue", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={getAppLogo(false).source}
            style={{ width: getAppLogo(false).width as number, height: getAppLogo(false).height as number, borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={toggleLang} style={styles.langButton}>
          <Ionicons name="globe-outline" size={18} color={PALETTE.russet} />
          <Text style={styles.langButtonText}>
            {currentLang === 'kab' ? 'Taqvaylit' : 'Français'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome')}</Text>
        {!accountNotFound && (
          <>
            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputGroup}></View>
            <Ionicons name="mail-outline" size={20} color={PALETTE.deepBlue} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={PALETTE.gri}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {invalidEmail && (
              <Text style={styles.errorText}>{t('auth/invalid-email')}</Text>
            )}
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={PALETTE.deepBlue} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder='**********'
                placeholderTextColor={PALETTE.gri}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev: boolean) => !prev)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={PALETTE.deepBlue} />
              </TouchableOpacity>
            </View>
            {wrongPassword && (
              <>
                <Text style={styles.errorText}>{t('auth/wrong-password')}</Text>
                <TouchableOpacity
                  style={styles.footerLinkContaineroub}
                  onPress={() => setShowResetModal(true)}
                >
                  <Text style={styles.footerLink}>{t('forgotPassword')}</Text>
                </TouchableOpacity>
              </>
            )}

            {userDisabled && (
              <Text style={styles.errorText}>{t('auth/user-disabled')}</Text>
            )}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/main/modals-others/registrationForm')}>
              <Text style={styles.registerButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
        {accountNotFound && (
          <>
            <Text style={styles.notFoundText}>{t('auth/user-not-found')}</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/main/modals-others/registrationForm')}>
              <Text style={styles.loginButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerLinkContainer}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.cegget.store')}
          >
            <Ionicons name={'storefront'} size={22} color={PALETTE.teal} />
            <Text style={styles.footerLink}>{t('titleMgz')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerLinkContainer}
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.cegget.driver')}
          >
            <Ionicons name={'bicycle'} size={22} color={PALETTE.teal} />
            <Text style={styles.footerLink}>{t('titleLvr')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ForgotPasswordModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.orange,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: PALETTE.grey,
  },
  logoContainer: {
    flexDirection: 'center',
    alignItems: 'center',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: PALETTE.linen,
  },
  langButtonText: {
    color: PALETTE.russet,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.grey,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '650',
    alignSelf: 'center',
    color: PALETTE.deepBlue,
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.deepBlue,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: PALETTE.black,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: PALETTE.black,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PALETTE.grey,
    borderWidth: 1.5,
    borderColor: PALETTE.teal,
    borderRadius: 999,
    paddingHorizontal: 20,
  },
  inputIcon: {
    flexShrink: 0,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  footerLink: {
    fontSize: 15,
    color: PALETTE.deepBlue,
    fontWeight: '600',
  },
  footerLinkContaineroub: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.teal,
    maxWidth: '28%',
    marginTop: 20,
    marginBottom: 10,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: PALETTE.teal,
  },
  loginButton: {
    backgroundColor: PALETTE.teal,
    borderRadius: 16,
    paddingVertical: 16,
    alignSelf: 'stretch',
    marginTop: 34,
    alignItems: 'center',
    width: '30%',
  },
  loginButtonText: {
    color: PALETTE.white,
    fontSize: 16,
    fontWeight: '650',
  },
  notFoundText: {
    color: PALETTE.black,
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  footer: {
    marginTop: 45,
    alignItems: 'flex-start',
    gap: 20,
  },
  errorText: {
    color: PALETTE.roj,
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'center',
    marginTop: 12,
  },
  registerButton: {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 4,
  },
  registerButtonText: {
    color: PALETTE.deepBlue,
    fontSize: 15,
    fontWeight: '700',
    alignSelf: 'center',
  },
});

export default LoginScreen;
