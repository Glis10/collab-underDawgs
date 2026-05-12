import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type Language = 'en' | 'ne';

type TranslationKey =
  | 'home'
  | 'contacts'
  | 'track'
  | 'settings'
  | 'welcomeBack'
  | 'ready'
  | 'currentArea'
  | 'network'
  | 'online'
  | 'emergencySos'
  | 'sosSubtitle'
  | 'tapHold'
  | 'emergencyDrill'
  | 'trackActive'
  | 'quickHelp'
  | 'chooseService'
  | 'policeHelp'
  | 'ambulance'
  | 'fireRescue'
  | 'trackRequest'
  | 'recentRequests'
  | 'lastActivity'
  | 'completed'
  | 'pending'
  | 'personalInfo'
  | 'editName'
  | 'preference'
  | 'darkMode'
  | 'notifications'
  | 'language'
  | 'english'
  | 'nepali'
  | 'security'
  | 'changePassword'
  | 'logout'
  | 'saveName'
  | 'fullName'
  | 'cancel'
  | 'emergencyContacts'
  | 'contactsSubtitle'
  | 'addServiceNumber'
  | 'name'
  | 'serviceType'
  | 'phoneNumber'
  | 'saveContact'
  | 'emergencyServices'
  | 'mySavedNumbers'
  | 'noSavedContacts'
  | 'liveTracking'
  | 'providerOnWay'
  | 'providerSubtitle'
  | 'estimatedArrival'
  | 'live'
  | 'routeTitle'
  | 'callProvider'
  | 'changePasswordTitle'
  | 'changePasswordSubtitle'
  | 'linkedEmail'
  | 'sendOtp'
  | 'backToSettings'
  | 'passwordHelpOne'
  | 'passwordHelpTwo'
  | 'passwordHelpThree'
  | 'logoutConfirmTitle'
  | 'logoutConfirmMessage';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    home: 'Home',
    contacts: 'Contacts',
    track: 'Track',
    settings: 'Settings',
    welcomeBack: 'Welcome back',
    ready: 'Ready',
    currentArea: 'Current area',
    network: 'Network',
    online: 'Online',
    emergencySos: 'Emergency SOS',
    sosSubtitle: 'Send your live location to nearby responders.',
    tapHold: 'Tap and hold in case of emergency',
    emergencyDrill: 'Emergency Drill',
    trackActive: 'Track Active',
    quickHelp: 'Quick Help',
    chooseService: 'Choose service',
    policeHelp: 'Police Help',
    ambulance: 'Ambulance',
    fireRescue: 'Fire Rescue',
    trackRequest: 'Track Request',
    recentRequests: 'Recent Requests',
    lastActivity: 'Last activity',
    completed: 'Completed',
    pending: 'Pending',
    personalInfo: 'Personal Info',
    editName: 'Edit Name',
    preference: 'Preference',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    language: 'Language',
    english: 'English',
    nepali: 'Nepali',
    security: 'Security',
    changePassword: 'Change Password',
    logout: 'Logout',
    saveName: 'Save Name',
    fullName: 'Full name',
    cancel: 'Cancel',
    emergencyContacts: 'Emergency Contacts',
    contactsSubtitle: 'Store numbers you may need fast',
    addServiceNumber: 'Add service number',
    name: 'Name',
    serviceType: 'Service type',
    phoneNumber: 'Phone number',
    saveContact: 'Save Contact',
    emergencyServices: 'Emergency services',
    mySavedNumbers: 'My saved numbers',
    noSavedContacts: 'No saved emergency contacts yet.',
    liveTracking: 'Live tracking',
    providerOnWay: 'Provider is on the way',
    providerSubtitle: 'Ambulance A-04 is heading to your shared location.',
    estimatedArrival: 'Estimated arrival',
    live: 'Live',
    routeTitle: 'Route to your location',
    callProvider: 'Call Provider',
    changePasswordTitle: 'Change Password',
    changePasswordSubtitle: 'We will send an OTP to your linked email so you can set a new password securely.',
    linkedEmail: 'Linked email',
    sendOtp: 'Send OTP',
    backToSettings: 'Back to Settings',
    passwordHelpOne: 'Use the email attached to your account.',
    passwordHelpTwo: 'Verify the 6-digit OTP.',
    passwordHelpThree: 'Create a new password with at least 8 characters.',
    logoutConfirmTitle: 'Logout?',
    logoutConfirmMessage: 'Are you sure you want to logout?',
  },
  ne: {
    home: 'गृह',
    contacts: 'सम्पर्क',
    track: 'ट्र्याक',
    settings: 'सेटिङ',
    welcomeBack: 'फेरि स्वागत छ',
    ready: 'तयार',
    currentArea: 'हालको क्षेत्र',
    network: 'नेटवर्क',
    online: 'अनलाइन',
    emergencySos: 'आपतकालीन SOS',
    sosSubtitle: 'नजिकका उद्धारकर्तालाई आफ्नो लाइभ लोकेसन पठाउनुहोस्।',
    tapHold: 'आपतकालमा थिचेर होल्ड गर्नुहोस्',
    emergencyDrill: 'आपतकालीन अभ्यास',
    trackActive: 'सक्रिय ट्र्याक',
    quickHelp: 'छिटो सहयोग',
    chooseService: 'सेवा छान्नुहोस्',
    policeHelp: 'प्रहरी सहयोग',
    ambulance: 'एम्बुलेन्स',
    fireRescue: 'दमकल उद्धार',
    trackRequest: 'अनुरोध ट्र्याक',
    recentRequests: 'हालका अनुरोध',
    lastActivity: 'अन्तिम गतिविधि',
    completed: 'सम्पन्न',
    pending: 'पेन्डिङ',
    personalInfo: 'व्यक्तिगत जानकारी',
    editName: 'नाम सम्पादन',
    preference: 'प्राथमिकता',
    darkMode: 'डार्क मोड',
    notifications: 'सूचनाहरू',
    language: 'भाषा',
    english: 'अङ्ग्रेजी',
    nepali: 'नेपाली',
    security: 'सुरक्षा',
    changePassword: 'पासवर्ड परिवर्तन',
    logout: 'लगआउट',
    saveName: 'नाम सेभ',
    fullName: 'पूरा नाम',
    cancel: 'रद्द',
    emergencyContacts: 'आपतकालीन सम्पर्क',
    contactsSubtitle: 'छिटो चाहिने नम्बरहरू सुरक्षित राख्नुहोस्',
    addServiceNumber: 'सेवा नम्बर थप्नुहोस्',
    name: 'नाम',
    serviceType: 'सेवा प्रकार',
    phoneNumber: 'फोन नम्बर',
    saveContact: 'सम्पर्क सेभ',
    emergencyServices: 'आपतकालीन सेवाहरू',
    mySavedNumbers: 'मेरा सुरक्षित नम्बर',
    noSavedContacts: 'अहिलेसम्म सुरक्षित आपतकालीन सम्पर्क छैन।',
    liveTracking: 'लाइभ ट्र्याकिङ',
    providerOnWay: 'सेवा प्रदायक आउँदैछ',
    providerSubtitle: 'एम्बुलेन्स A-04 तपाईंको साझा लोकेसनतर्फ आउँदैछ।',
    estimatedArrival: 'अनुमानित आगमन',
    live: 'लाइभ',
    routeTitle: 'तपाईंको स्थानसम्मको बाटो',
    callProvider: 'प्रदायकलाई कल',
    changePasswordTitle: 'पासवर्ड परिवर्तन',
    changePasswordSubtitle: 'नयाँ पासवर्ड सुरक्षित रूपमा राख्न हामी तपाईंको लिंक भएको इमेलमा OTP पठाउँछौं।',
    linkedEmail: 'लिंक भएको इमेल',
    sendOtp: 'OTP पठाउनुहोस्',
    backToSettings: 'सेटिङमा फर्कनुहोस्',
    passwordHelpOne: 'आफ्नो खातासँग जोडिएको इमेल प्रयोग गर्नुहोस्।',
    passwordHelpTwo: '६ अंकको OTP पुष्टि गर्नुहोस्।',
    passwordHelpThree: 'कम्तीमा ८ अक्षरको नयाँ पासवर्ड बनाउनुहोस्।',
    logoutConfirmTitle: 'लगआउट गर्ने?',
    logoutConfirmMessage: 'के तपाईं पक्का लगआउट गर्न चाहनुहुन्छ?',
  },
};

type AppPreferencesValue = {
  darkMode: boolean;
  language: Language;
  setDarkMode: (value: boolean) => void;
  setLanguage: (value: Language) => void;
  t: (key: TranslationKey) => string;
};

const AppPreferencesContext = createContext<AppPreferencesValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo(
    () => ({
      darkMode,
      language,
      setDarkMode,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
    }),
    [darkMode, language]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used inside AppPreferencesProvider.');
  }

  return context;
}
