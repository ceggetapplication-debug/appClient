import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { LogLevel, OneSignal } from "react-native-onesignal";
import { useStore } from "@/services/store/store";

export default function HomeLayout() {
	const { user } = useStore();

	useEffect(() => {
		OneSignal.Debug.setLogLevel(LogLevel.Verbose);
		OneSignal.initialize("VOTRE_ONESIGNAL_APP_ID");
		OneSignal.Notifications.requestPermission(true);

		if (user) {
			const userId = user.userId || user.$id;
			if (userId) {
				OneSignal.login(userId);
			}
		}
		const notificationClickListener = (event: any) => {
			console.log("Notification reçue/cliquée :", event);
		};
		OneSignal.Notifications.addEventListener("click", notificationClickListener);

		return () => {
			OneSignal.Notifications.removeEventListener("click", notificationClickListener);
		};
	}, [user]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="mainScreens/home" />
			<Stack.Screen name="mainScreens/search" />
			<Stack.Screen name="mainScreens/favorite" />
			<Stack.Screen name="mainScreens/cart" />
			<Stack.Screen name="mainScreens/profile" />
			<Stack.Screen name="mainScreens/loginScreen" />
		</Stack>
	);
}