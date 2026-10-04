import type { Models } from "react-native-appwrite";
import { createStore } from "stan-js";
import { storage } from "stan-js/storage";

export type AppLanguage = "kab" | "fr";

export const { useStoreEffect, useStore, store } = createStore({
	user: storage<Models.Session | undefined>(undefined, {
		storageKey: "user",
	}),
	selectedLanguage: storage<AppLanguage | undefined>(undefined, {
		storageKey: "appLanguage",
	}),
});

export const setUser = (user: Models.Session | undefined) => {
	store.user = user;
};

export const setSelectedLanguage = (selectedLanguage: AppLanguage) => {
	store.selectedLanguage = selectedLanguage;
};
