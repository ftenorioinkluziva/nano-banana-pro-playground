"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { translations, type TranslationKey } from "./image-combiner/translations"

type Language = "en" | "pt"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: typeof translations.en
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Start with "en" to match server-side rendering and avoid hydration mismatch
    const [language, setLanguageState] = useState<Language>("en")
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const savedLanguage = localStorage.getItem("language") as Language
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "pt")) {
            setLanguageState(savedLanguage)
        } else {
            // Default to Portuguese on client if no saved preference
            setLanguageState("pt")
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
    }

    const t = (isMounted ? translations[language] : translations.en) as typeof translations.en

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            <div className={isMounted ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
                {children}
            </div>
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
