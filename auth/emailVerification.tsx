import Selection from "@/components/selection";
import { client } from "@/services/api/init";
import {
	NavigationProp,
	NavigationState,
	ParamListBase,
} from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useState } from "react";
import { Image, Pressable, TextInput, ToastAndroid, View } from "react-native";
import { Account, ID } from "react-native-appwrite";
import Modal from "react-native-modal";
import { Button, Checkbox, Text } from "react-native-paper";
import {
	StyleSheet,
	UnistylesRuntime,
	useUnistyles,
} from "react-native-unistyles";
import logo from "../../assets/images/logo-big.png";

import { useI18n } from "@/hooks/language/useI18n";
import { useStore } from "@/services/store/store";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Inputs = {
	code: string;
};

export default function EmailVerification() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<Inputs>({
		mode: "onChange",
	});



	const [isLoading, setIsLoading] = useState(false);
	const { user, setUser } = useStore();

	const sendEmailVerification = async (data: Inputs) => {
		try {
			setIsLoading(true);
			const account = new Account(client);

			const result = account.createVerification("https://example.com");
			console.log(
				"🚀 ~ file: emailVerification.tsx:54 ~ sendEmailVerification ~ result:",
				result,
			);
		} catch (error: any) {
			console.log("error", error);
			ToastAndroid.show(error.code, ToastAndroid.SHORT);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		try {
			const account = new Account(client);

			const result = account.deleteSession("current");
			setUser(undefined);
		} catch (error) { }
	};

	return (
		<View style={[styles.container]}>
			<View
				style={{
					flex: 1,
					alignContent: "center",
					// justifyContent: "space-around",
					alignItems: "center",
				}}
			>
				<View
					style={{
						alignItems: "center",
						marginVertical: "5%",
					}}
				>
					<Image
						source={logo}
						style={{
							width: 120,
							height: 120,
						}}
						resizeMode="contain"
					/>
					<Text
						variant="bodyMedium"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								color: theme.colors.typography,
							},
						]}
					>
						{"Cegget"}
					</Text>
				</View>

				<View
					style={{
						flex: 1,
						backgroundColor: theme.colors.surface,
						width: "100%",
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
					}}
				>
					<Text
						variant="bodyMedium"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								color: theme.colors.textOnSurface,
							},
						]}
					>
						{"Verification Code"}
					</Text>

					<Text
						variant="bodySmall"
						style={[
							{
								textAlign: "center",
								fontWeight: "bold",
								marginVertical: 8,
								marginHorizontal: "5%",
								color: theme.colors.captionOnSurface,
							},
						]}
					>
						{"You need to enter 4-digit code we send to your email address."}
						{user?.providerUid}
					</Text>

					<View
						style={{
							marginHorizontal: "4%",
						}}
					>
						<Controller
							control={control}
							rules={{
								required: "code is required",
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<TextInput
									placeholder={"code"}
									placeholderTextColor={theme.colors.captionOnSurface}
									style={{
										borderWidth: 1,
										borderColor: theme.colors.borderInactive,
										color: theme.colors.textOnSurface,
										paddingVertical: 12,
										paddingHorizontal: 8,
										height: 40,
										borderRadius: 6,
										marginVertical: 6,
									}}
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
								/>
							)}
							name="code"
						/>

						{errors.code && (
							<Text
								style={{
									color: "red",
								}}
							>
								{errors.code.message}
							</Text>
						)}
					</View>

					<Pressable
						android_ripple={{
							color: theme.colors.ripple,
						}}
						style={{
							alignSelf: "flex-end",
							alignContent: "center",
							alignItems: "center",
							marginHorizontal: "4%",
						}}
					>
						<Text
							variant="bodySmall"
							style={{
								textAlign: "left",

								color: theme.colors.primary,
							}}
						>
							{"renvoyer le code"}
						</Text>
					</Pressable>

					<Button
						loading={isLoading}
						style={{
							marginHorizontal: "4%",
							marginVertical: "8%",
							// backgroundColor: theme.colors.primary,
						}}
						textColor={theme.colors.primary}
						mode="text"
						onPress={logout}
					>
						{t("buttons.logout")}
					</Button>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
}));
