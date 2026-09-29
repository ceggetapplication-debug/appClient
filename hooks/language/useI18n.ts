import i18next from "i18next";

import { SupportedLanguages } from "./schema";

const changeLanguage = (lang: SupportedLanguages) => {
	console.log("changing language to ", lang);
	i18next.changeLanguage(lang);
};

const toggleLanguage = () => {
	i18next.changeLanguage(
		i18next.language === SupportedLanguages.KAB_KAB
			? SupportedLanguages.FR_FR
			: SupportedLanguages.KAB_KAB,
	);
};

export const useI18n = () => {
	return { changeLanguage, toggleLanguage };
};
