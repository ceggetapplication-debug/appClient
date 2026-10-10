import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { UnistylesRuntime } from "react-native-unistyles";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Models } from "react-native-appwrite";
import { useAppTranslation } from '@/translations/data/translationCentralization';

import { CartProvider } from "@/contexts/CartContext";
import { useStore, useStoreEffect } from "@/services/store/store";
import { account } from "@/main/calculation-logic/appwriteConfig";

import LanguageScreen from "@/onboarding/index";
import OnboardingScreen from "@/onboarding/onboarding";

import LoginScreen from "@/main/mainScreens/loginScreen";
import RegistrationForm from "@/main/modals-others/registrationForm";
import ForgotPasswordModal from "@/main/modals-others/modalChangeResetPassword";
import VerificationStack from "@/navigations/verificationStack";

import HomeScreen from "@/main/mainScreens/home";
import SearchScreen from "@/main/mainScreens/search";
import FavoritesScreen from "@/main/mainScreens/favorite";
import ShoppingCartScreen from "@/main/mainScreens/cart";
import ProfileScreen from "@/main/mainScreens/profile";

import StoreDetailsScreen from "@/main/modals-others/modalMagasinInfos";
import ModalMapBuyer from "@/main/modals-others/modalMapBuyer";
import ModalProductInfos from "@/main/modals-others/modalProductInfos";
import ModalOrderQuantity from "@/main/modals-others/modalOrderQuantity";
import PremiumUtiliOffersModal from "@/main/modals-others/modalPremiums";
import InviteFriendsModal from "@/main/modals-others/InviteFriendsModal";
import QRgenerator from "@/main/modals-others/QRgenerator";
import { CartProductsTab } from "@/main/modals-others/CartProductsTab";
import { DeliveryStatusTab } from "@/main/modals-others/DeliveryStatusTab";
import { ShoppingListTab } from "@/main/modals-others/ShoppingListTab";
import CustomBottomTabs from "@/components/components/CustomBottomTabs";

export type OnboardingParamList = {
	LanguageSelector: undefined;
	OnboardingIntro: undefined;
};

export type AuthParamList = {
	Login: undefined;
	SignUp: undefined;
	RegistrationForm: undefined;
	ForgotPassword: undefined;
};

export type MainTabParamList = {
	Home: undefined;
	Search: undefined;
	Favorite: undefined;
	Shopping: undefined;
	Profile: undefined;
};

export type MainStackParamList = {
	MainTabs: undefined;
	SearchScreen: { query?: string };
	MagasinInfos: { storeId: string };
	MapBuyer: { onSelectLocation?: (lat: number, lng: number) => void };
	ProductInfos: { productId: string };
	OrderQuantity: { productId: string; maxQty?: number };
	Premiums: undefined;
	InviteFriends: undefined;
	QRGenerator: { orderData: any; externalDriverDistance: number | null };
	CartProducts: undefined;
	DeliveryStatus: { orderId?: string };
	ShoppingList: undefined;
};

export type RootStackParamList = {
	OnboardingStack: undefined;
	AuthStack: undefined;
	MainStack: undefined;
	VerificationStack: undefined;
};

SplashScreen.preventAutoHideAsync();

const { t } = useAppTranslation();
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStackNav = createStackNavigator<AuthParamList>();
const OnboardingStackNav = createStackNavigator<OnboardingParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const MainStackNav = createStackNavigator<MainStackParamList>();

type CurrentStack = "LoggedIn" | "NotLoggedIn" | "NotVerified" | "Onboarding";

const OnboardingNavigator = () => (
	<OnboardingStackNav.Navigator screenOptions={{ headerShown: false }}>
		<OnboardingStackNav.Screen name="LanguageSelector" component={LanguageScreen} />
		<OnboardingStackNav.Screen name="OnboardingIntro" component={OnboardingScreen} />
	</OnboardingStackNav.Navigator>
);

const AuthNavigator = () => (
	<AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
		<AuthStackNav.Screen name="Login" component={LoginScreen} />
		<AuthStackNav.Screen name="SignUp" component={RegistrationForm} />
		<AuthStackNav.Screen name="RegistrationForm" component={RegistrationForm} />
		<AuthStackNav.Screen name="ForgotPassword" component={ForgotPasswordModal} />
	</AuthStackNav.Navigator>
);

const BottomTabNavigator = () => (
	<MainTabNav.Navigator tabBar={(props: BottomTabBarProps) => <CustomBottomTabs {...props} />}>
		<MainTabNav.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
		<MainTabNav.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
		<MainTabNav.Screen name="Favorite" component={FavoritesScreen} options={{ headerShown: false }} />
		<MainTabNav.Screen name="Shopping" component={ShoppingCartScreen} options={{ headerShown: false }} />
		<MainTabNav.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
	</MainTabNav.Navigator>
);

const MainNavigator = () => (
	<MainStackNav.Navigator screenOptions={{ headerShown: false }}>
		<MainStackNav.Screen name="MainTabs" component={BottomTabNavigator} />
		<MainStackNav.Screen name="SearchScreen" component={SearchScreen} />
		<MainStackNav.Screen name="MagasinInfos" component={StoreDetailsScreen as any} />
		<MainStackNav.Screen name="MapBuyer" component={ModalMapBuyer as any} />
		<MainStackNav.Screen name="ProductInfos" component={ModalProductInfos as any} />
		<MainStackNav.Screen name="OrderQuantity" component={ModalOrderQuantity as any} />
		<MainStackNav.Screen name="Premiums" component={PremiumUtiliOffersModal as any} />
		<MainStackNav.Screen name="InviteFriends" component={InviteFriendsModal as any} />
		<MainStackNav.Screen name="QRGenerator" component={QRgenerator as any} />
		<MainStackNav.Screen name="CartProducts" component={CartProductsTab as any} />
		<MainStackNav.Screen name="DeliveryStatus" component={DeliveryStatusTab as any} />
		<MainStackNav.Screen name="ShoppingList" component={ShoppingListTab as any} />
	</MainStackNav.Navigator>
);

const VerificationNavigator = () => (
	<RootStack.Navigator screenOptions={{ headerShown: false }}>
		<RootStack.Screen name="VerificationStack" component={VerificationStack} />
	</RootStack.Navigator>
);

const AppNavigator = () => {
	const { user, selectedLanguage } = useStore();
	const [currentStack, setCurrentStack] = useState<CurrentStack>("Onboarding");

	useStoreEffect(({ user, selectedLanguage }: { user: Models.Session | undefined; selectedLanguage: string | null }) => {
		if (user) {
			setCurrentStack("LoggedIn");
		} else if (selectedLanguage) {
			setCurrentStack("NotLoggedIn");
		} else {
			setCurrentStack("Onboarding");
		}
	});

	useEffect(() => {
		const handleValidationLink = (event: { url: string }) => {
			const isPassword = event.url.includes("reset-password");
			const isEmail = event.url.includes("verify-email");
			if (isPassword || isEmail) {
				const msg = isPassword ? t('profileScreen.passwordUpdatedSuccess') : t('profileScreen.emailUpdatedSuccess');
				Alert.alert(t('general.success'), msg);
			}
		};

		const subscription = Linking.addEventListener("url", handleValidationLink);

		Linking.getInitialURL().then((url: string | null) => {
			if (url) {
				const isPassword = url.includes("reset-password");
				const isEmail = url.includes("verify-email");
				if (isPassword || isEmail) {
					const msg = isPassword ? t('profileScreen.passwordUpdatedSuccess') : t('profileScreen.emailUpdatedSuccess');
					Alert.alert(t('general.success'), msg);
				}
			}
		});

		return () => subscription.remove();
	}, []);

	switch (currentStack) {
		case "LoggedIn":
			return <MainNavigator />;
		case "NotVerified":
			return <VerificationNavigator />;
		case "NotLoggedIn":
			return <AuthNavigator />;
		case "Onboarding":
		default:
			return <OnboardingNavigator />;
	}
};

const AppRoot = () => {
	const loaded = true;
	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider style={{ flex: 1 }}>
			<NavigationContainer theme={UnistylesRuntime.getTheme()}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<BottomSheetModalProvider>
						<CartProvider children={<AppNavigator />}>
							<AppNavigator />
							<StatusBar style="auto" />
						</CartProvider>
					</BottomSheetModalProvider>
				</GestureHandlerRootView>
			</NavigationContainer>
		</SafeAreaProvider>
	);
};

export { AppRoot };