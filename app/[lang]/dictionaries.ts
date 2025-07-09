import "server-only" // Ensure this file only runs on the server [^1][^2]

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  es: () => import("./dictionaries/es.json").then((module) => module.default),
}

export const getDictionary = async (locale: "en" | "es") => dictionaries[locale]?.() ?? dictionaries.en() // Fallback to English if locale not found
