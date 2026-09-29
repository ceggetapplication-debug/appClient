import "intl-pluralrules";

import type { Language } from "@/hooks/language/schema";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import kab from "./data/kab.json";
import fr from "./data/fr.json";

export const defaultNS = "cegget" as const;

export const resources = {
	kab_KAB: kab,
	fr_FR: fr,
} as const satisfies Record<Language, unknown>;

i18n
	.use(initReactI18next)
	.init({
		defaultNS,
		fallbackLng: "KAB_KAB",
		lng: "KAB_KAB",
		resources,
	})
	.then(() => {
		i18n.services.formatter?.add(
			"capitalize",
			(value: string) =>
				value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
		);
	});

export default i18n;
