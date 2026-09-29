import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useStore, useStoreEffect } from "@/services/store/store";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

type CurrentStack = "LoggedIn" | "NotLoggedIn" | "Onboarding";
export default function RootLayout() {
	const { user, selectedLanguage } = useStore();

	const [currentStack, setCurrentStack] = useState<CurrentStack>("Onboarding");

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	useStoreEffect(({ user, selectedLanguage }) => {
		if (user) setCurrentStack("LoggedIn");

		if (selectedLanguage && !user) setCurrentStack("NotLoggedIn");

		if (!user && !selectedLanguage) setCurrentStack("Onboarding");
	});

	if (!loaded) {
		return null;
	}

	return (
		<Stack>
			{currentStack === "LoggedIn" && (
				<Stack.Screen name="main" options={{ headerShown: false }} />
			)}

			{currentStack === "NotLoggedIn" && (
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			)}

			{currentStack === "Onboarding" && (
				<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
			)}

			<Stack.Screen name="+not-found" />
			<StatusBar style="auto" />
		</Stack>
	);

	if (user)
		return (
			<>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="main" options={{ headerShown: false }} />

					<Stack.Screen name="+not-found" />
				</Stack>
				<StatusBar style="auto" />
			</>
		);

	if (selectedLanguage)
		return (
			<>
				<Stack>
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />

					<Stack.Screen name="+not-found" />
				</Stack>
				<StatusBar style="auto" />
			</>
		);

	return (
		<>
			<Stack
				screenOptions={{
					headerShown: false,
				}}
			>
				<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />

				<Stack.Screen name="+not-found" />
			</Stack>
			<StatusBar style="auto" />
		</>
	);
}
