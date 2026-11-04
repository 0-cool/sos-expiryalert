import type { TranslationResource } from "./en";

const fr: TranslationResource = {
  common: {
    appName: "SOS – ExpiryAlert",
    tagline: "Ne manquez plus aucune date importante.",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
    delete: "Supprimer",
    edit: "Modifier",
    done: "Terminé",
    close: "Fermer",
    continue: "Continuer",
    next: "Suivant",
    back: "Retour",
    retry: "Réessayer",
    ok: "OK",
    notNow: "Plus tard",
    optional: "Facultatif",
    seeAll: "Tout voir",
    openSettings: "Ouvrir les réglages",
    loading: "Chargement…",
    on: "Activé",
    off: "Désactivé",
  },
  onboarding: {
    skip: "Passer",
    getStarted: "Commencer",
    slides: {
      track: {
        title: "Toutes vos dates d’expiration au même endroit",
        body: "Passeports, permis, assurances et plus encore. Ajoutez un document en quelques secondes et voyez d’un coup d’œil ce qui demande votre attention.",
      },
      remind: {
        title: "Des rappels avant qu’il soit trop tard",
        body: "Recevez une notification 90, 30, 7 et 1 jour avant l’expiration d’un document — ou choisissez vos propres rappels.",
      },
      privacy: {
        title: "Confidentiel par conception",
        body: "Aucun numéro ni scan de document enregistré. Les scans facultatifs sont lus sur votre appareil puis supprimés ; nous enregistrons uniquement le type, le nom et la date.",
      },
    },
    notifications: {
      title: "Activez les rappels",
      body: "Les rappels sont au cœur de SOS – ExpiryAlert. Autorisez les notifications pour être prévenu avant l’expiration d’un document.",
      enable: "Activer les rappels",
      later: "Peut-être plus tard",
      denied:
        "Les notifications sont désactivées. Vous pourrez les activer plus tard dans les Réglages.",
    },
  },
  auth: {
    signInTitle: "Bon retour parmi nous",
    signInSubtitle: "Connectez-vous pour voir vos documents et vos rappels.",
    signUpTitle: "Créez votre compte",
    signUpSubtitle:
      "Votre compte protège vos documents sur tous vos appareils.",
    email: "E-mail",
    emailPlaceholder: "vous@exemple.com",
    password: "Mot de passe",
    passwordPlaceholder: "Au moins 8 caractères",
    confirmPassword: "Confirmer le mot de passe",
    newPassword: "Nouveau mot de passe",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    noAccount: "Vous n’avez pas de compte ?",
    haveAccount: "Vous avez déjà un compte ?",
    forgotPassword: "Mot de passe oublié ?",
    forgotTitle: "Réinitialisez votre mot de passe",
    forgotSubtitle:
      "Saisissez votre e-mail et nous vous enverrons un code de vérification.",
    sendCode: "Envoyer le code",
    resetTitle: "Choisissez un nouveau mot de passe",
    resetSubtitle:
      "Saisissez le code envoyé à {{email}} et votre nouveau mot de passe.",
    resetPassword: "Mettre à jour le mot de passe",
    passwordUpdated: "Votre mot de passe a été mis à jour.",
    code: "Code de vérification",
    codePlaceholder: "Code à 6 chiffres",
    verifyTitle: "Consultez vos e-mails",
    verifySubtitle:
      "Nous avons envoyé un code de vérification à {{email}}. Saisissez-le ci-dessous pour activer votre compte.",
    verifyLinkHint:
      "Vous pouvez aussi toucher le lien de l’e-mail, puis vous connecter ici.",
    verify: "Vérifier l’e-mail",
    resendCode: "Renvoyer le code",
    resendIn: "Renvoyer le code dans {{seconds}} s",
    codeSent: "Un nouveau code a été envoyé à {{email}}.",
    backToSignIn: "Retour à la connexion",
    privacyNote:
      "Nous n’enregistrons jamais de numéros ni d’images de scan. Le scan facultatif est traité sur votre appareil.",
  },
  validation: {
    emailRequired: "Saisissez votre e-mail.",
    emailInvalid: "Saisissez une adresse e-mail valide.",
    passwordRequired: "Saisissez votre mot de passe.",
    passwordTooShort: "Utilisez au moins 8 caractères.",
    passwordsDontMatch: "Les mots de passe ne correspondent pas.",
    codeInvalid: "Saisissez le code reçu par e-mail (6 à 10 chiffres).",
    typeRequired: "Choisissez un type de document.",
    nameRequired: "Saisissez un nom pour ce document.",
    nameTooLong: "Utilisez au maximum {{max}} caractères.",
    dateRequired: "Choisissez la date d’expiration.",
    dateInvalid: "Choisissez une date valide.",
    notesTooLong: "Les notes peuvent contenir au maximum {{max}} caractères.",
    sensitiveNumber:
      "Cela ressemble à un numéro d’identification. Pour votre confidentialité, n’enregistrez pas de numéros de document.",
    pastDate:
      "Cette date est déjà passée. Le document sera marqué comme expiré.",
  },
  errors: {
    title: "Un problème est survenu",
    generic: "Un problème est survenu. Veuillez réessayer.",
    network: "Vous semblez hors ligne. Vérifiez votre connexion et réessayez.",
    notConfigured:
      "L’app n’est pas encore connectée à son serveur. Consultez les instructions du README.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    emailNotConfirmed:
      "Veuillez vérifier votre e-mail avant de vous connecter.",
    userAlreadyExists:
      "Un compte existe déjà avec cet e-mail. Essayez de vous connecter.",
    weakPassword: "Ce mot de passe est trop faible. Essayez-en un plus long.",
    samePassword: "Le nouveau mot de passe doit être différent de l’ancien.",
    invalidCode: "Ce code est invalide ou a expiré. Demandez-en un nouveau.",
    rateLimited: "Trop de tentatives. Patientez un instant et réessayez.",
    notFound: "Ce document est introuvable. Il a peut-être été supprimé.",
    sessionExpired: "Votre session a expiré. Veuillez vous reconnecter.",
    permissionDenied: "Vous n’avez pas l’autorisation de faire cela.",
  },
  config: {
    title: "Configuration requise",
    missing:
      "Ajoutez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY à votre fichier .env, puis redémarrez l’app.",
    invalidUrl: "EXPO_PUBLIC_SUPABASE_URL n’est pas une URL valide.",
    secretKey:
      "Une clé secrète Supabase a été fournie et ignorée. Dans l’app, utilisez la clé publiable (anon) — jamais une clé secrète.",
  },
  offline: {
    banner: "Vous êtes hors ligne. Affichage de vos documents enregistrés.",
    cannotSave:
      "Vous êtes hors ligne. Connectez-vous à Internet pour enregistrer les modifications.",
  },
  tabs: {
    dashboard: "Aperçu",
    documents: "Documents",
    settings: "Réglages",
  },
  dashboard: {
    title: "Aperçu",
    totalDocuments: "Documents au total",
    breakdownLabel: "Répartition par statut",
    addDocument: "Ajouter un document",
    upcoming: "Prochaines échéances",
    nothingUpcoming: "Aucune échéance à venir. Tout est en ordre.",
    expiredAlert_one: "{{count}} document a expiré",
    expiredAlert_other: "{{count}} documents ont expiré",
    expiredAlertBody:
      "Renouvelez-le dès que possible, ou mettez à jour la date si c’est déjà fait.",
    review: "Vérifier",
    emptyTitle: "Aucun document pour l’instant",
    emptyBody:
      "Ajoutez votre premier document et nous vous préviendrons avant son expiration.",
    emptyAction: "Ajouter mon premier document",
    remindersOffTitle: "Les rappels sont désactivés",
    remindersOffBody:
      "Activez les notifications pour être prévenu avant l’expiration de vos documents.",
    remindersOffAction: "Activer",
  },
  documents: {
    title: "Documents",
    searchPlaceholder: "Rechercher des documents",
    clearSearch: "Effacer la recherche",
    filters: {
      all: "Tous",
      active: "Valides",
      expiring_soon: "Bientôt expirés",
      expired: "Expirés",
    },
    sortSoonest: "Les plus proches d’abord",
    sortLatest: "Les plus lointains d’abord",
    sortLabel: "Trier par date d’expiration",
    emptyTitle: "Aucun document pour l’instant",
    emptyBody:
      "Touchez le bouton + pour ajouter un passeport, un permis, une assurance ou tout autre document.",
    noResultsTitle: "Aucun résultat",
    noResultsBody: "Essayez une autre recherche ou un autre filtre.",
    clearFilters: "Effacer les filtres",
    deleteTitle: "Supprimer le document ?",
    deleteMessage:
      "« {{name}} » et ses rappels seront supprimés. Cette action est irréversible.",
    deleted: "Document supprimé",
    add: "Ajouter un document",
  },
  documentForm: {
    addTitle: "Ajouter un document",
    editTitle: "Modifier le document",
    typeLabel: "Type de document",
    nameLabel: "Nom ou titulaire",
    namePlaceholder: "ex. : John Smith",
    nameHelper:
      "De quoi le reconnaître, comme le nom du titulaire. Jamais le numéro du document.",
    dateLabel: "Date d’expiration",
    datePlaceholder: "Choisir une date",
    notesLabel: "Notes",
    notesPlaceholder: "ex. : Renouveler au consulat",
    remindersLabel: "Me rappeler",
    remindersHelper: "Les notifications arrivent à {{time}}.",
    remindersNone: "Aucun rappel pour ce document.",
    scanDocument: "Scanner un document",
    scanProcessing: "Lecture du document…",
    voiceInput: "Dicter un document",
    voiceStop: "Arrêter l’écoute",
    voiceExample:
      "Exemple : « Ajoute mon permis de conduire, Ana Souza, qui expire le 22 décembre 2026. »",
    voicePrivacy:
      "La voix est reconnue uniquement sur cet appareil ; l’audio n’est pas envoyé. Indiquez le type, le nom du titulaire et la date d’expiration. Vérifiez les suggestions avant l’enregistrement. La langue vocale hors ligne doit être disponible sur votre appareil.",
    voiceDevelopmentBuildRequired:
      "La saisie vocale nécessite la version de développement SOS ; elle n’est pas disponible dans Expo Go.",
    voicePermissionDenied:
      "L’accès au microphone ou à la reconnaissance vocale a été refusé. Autorisez-le dans les réglages de l’appareil pour dicter.",
    voiceUnavailableOffline:
      "La reconnaissance vocale locale est indisponible pour cette langue. Sur iOS, la langue de l’app doit correspondre à la langue principale du téléphone ; sur Android, Android 13+ et le téléchargement de la langue hors ligne sont requis. Sinon, saisissez les données.",
    voiceNoSpeech:
      "Aucune voix détectée. Réessayez ou saisissez les données manuellement.",
    voiceNoDetails:
      "Impossible d’identifier les informations du document dans cette phrase. Réessayez ou saisissez-les manuellement.",
    voiceRecognitionFailed:
      "La reconnaissance vocale a échoué. Réessayez ou saisissez les données manuellement.",
    scanPrivacy:
      "Le type, le nom et la date d’expiration seront lus sur cet appareil. L’image est supprimée et jamais envoyée. Vérifiez les suggestions, puis choisissez les rappels et ajoutez des notes.",
    scanReview:
      "Vérifiez le type, le nom et la date suggérés. Choisissez les rappels et ajoutez des notes avant d’enregistrer.",
    developmentBuildRequired:
      "La reconnaissance de texte nécessite la version de développement SOS ; elle n’est pas disponible dans Expo Go.",
    scannerUnavailable:
      "Le scanner de documents n’est pas disponible sur cet appareil.",
    cameraFailed:
      "Le scanner n’a pas pu démarrer. Vérifiez l’accès à l’appareil photo et réessayez.",
    recognitionFailed:
      "Impossible de lire ce document. Essayez un scan plus net et mieux éclairé, ou saisissez les données manuellement.",
    nothingRecognized:
      "Aucun type, nom ou date d’expiration détecté. Réessayez ou saisissez les données manuellement.",
    temporaryFileCleanupFailed:
      "Impossible de supprimer un scan temporaire de cet appareil. Il peut rester dans le stockage temporaire jusqu’à son nettoyage par le système.",
    privacyNote:
      "Votre confidentialité compte. Nous enregistrons uniquement les informations nécessaires pour vous rappeler les dates d’expiration.",
    save: "Enregistrer le document",
    saveChanges: "Enregistrer les modifications",
    discardTitle: "Abandonner les modifications ?",
    discardMessage:
      "Les modifications de ce document ne seront pas enregistrées.",
    discard: "Abandonner",
    keepEditing: "Continuer la modification",
  },
  documentDetails: {
    title: "Document",
    expiresOn: "Expire le {{date}}",
    expiredOn: "A expiré le {{date}}",
    remindersTitle: "Rappels",
    remindersEmpty: "Aucun rappel n’est défini pour ce document.",
    reminderPassed: "Passé",
    configureReminders: "Configurer les rappels",
    notesTitle: "Notes",
    notificationsDisabled:
      "Les notifications sont désactivées : ces rappels ne seront pas envoyés.",
    deleteDocument: "Supprimer le document",
    notFoundTitle: "Document introuvable",
    lastUpdated: "Mis à jour le {{date}}",
  },
  reminders: {
    title: "Rappels",
    subtitle: "Choisissez quand nous devons vous prévenir pour « {{name}} ».",
    option_zero: "Le jour de l’expiration",
    option_one: "{{count}} jour avant",
    option_other: "{{count}} jours avant",
    optionShort_zero: "Le jour même",
    optionShort_one: "{{count}} jour",
    optionShort_other: "{{count}} jours",
    scheduledFor: "{{date}} à {{time}}",
    passed: "Déjà passé",
    resetDefaults: "Utiliser les rappels par défaut",
    saved: "Rappels mis à jour",
  },
  status: {
    active: "Valide",
    expiring_soon: "Expire bientôt",
    expired: "Expiré",
  },
  time: {
    expiresToday: "Expire aujourd’hui",
    expiresTomorrow: "Expire demain",
    expiredYesterday: "A expiré hier",
    daysLeft_one: "{{count}} jour restant",
    daysLeft_other: "{{count}} jours restants",
    expiredDaysAgo_one: "A expiré il y a {{count}} jour",
    expiredDaysAgo_other: "A expiré il y a {{count}} jours",
    inDays_one: "dans {{count}} jour",
    inDays_other: "dans {{count}} jours",
    inMonths_one: "dans {{count}} mois",
    inMonths_other: "dans {{count}} mois",
    inYears_one: "dans {{count}} an",
    inYears_other: "dans {{count}} ans",
    daysUnit_one: "jour",
    daysUnit_other: "jours",
  },
  documentTypes: {
    passport: "Passeport",
    drivers_license: "Permis de conduire",
    national_id: "Carte d’identité",
    visa: "Visa",
    residence_permit: "Titre de séjour",
    vehicle_registration: "Carte grise",
    vehicle_insurance: "Assurance auto",
    medical_insurance: "Assurance santé",
    professional_certification: "Certification professionnelle",
    other: "Autre",
  },
  notifications: {
    channelName: "Rappels d’expiration",
    channelDescription: "Des rappels avant l’expiration de vos documents.",
    titleSoon: "{{type}} : expiration proche",
    titleToday: "{{type}} : expire aujourd’hui",
    bodyDays_one: "« {{name}} » expire dans {{count}} jour, le {{date}}.",
    bodyDays_other: "« {{name}} » expire dans {{count}} jours, le {{date}}.",
    bodyTomorrow: "« {{name}} » expire demain, le {{date}}.",
    bodyToday:
      "« {{name}} » expire aujourd’hui. Il est temps de le renouveler.",
    privateTitle: "Rappel de document",
    privateBody_zero:
      "L’un de vos documents expire aujourd’hui. Ouvrez l’app pour voir les détails.",
    privateBody_one:
      "L’un de vos documents expire dans {{count}} jour. Ouvrez l’app pour voir les détails.",
    privateBody_other:
      "L’un de vos documents expire dans {{count}} jours. Ouvrez l’app pour voir les détails.",
    testTitle: "Rappel de test",
    testBody:
      "Les notifications fonctionnent. Vous serez prévenu avant l’expiration de vos documents.",
  },
  settings: {
    title: "Réglages",
    sectionPreferences: "Préférences",
    sectionNotifications: "Notifications",
    sectionPrivacy: "Confidentialité et compte",
    sectionAbout: "À propos",
    language: "Langue",
    languageSystem: "Langue du système",
    theme: "Apparence",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",
    notifications: "Notifications",
    privacy: "Confidentialité",
    account: "Compte",
    version: "Version",
    signedInAs: "Connecté en tant que",
    logout: "Se déconnecter",
    logoutTitle: "Se déconnecter ?",
    logoutMessage:
      "Vos documents restent en sécurité dans votre compte. Les rappels sur cet appareil s’arrêteront jusqu’à votre prochaine connexion.",
  },
  notificationSettings: {
    title: "Notifications",
    permissionTitle: "Autorisation du système",
    permissionGranted: "Autorisées",
    permissionDenied: "Bloquées",
    permissionUndetermined: "Pas encore demandée",
    permissionDeniedHelp:
      "Les notifications sont bloquées pour cette app. Ouvrez les réglages du système pour les autoriser.",
    allow: "Autoriser les notifications",
    remindersEnabled: "Rappels d’expiration",
    remindersEnabledHelp:
      "Désactivez pour suspendre tous les rappels sur cet appareil.",
    reminderTime: "Heure du rappel",
    defaultReminders: "Rappels par défaut",
    defaultRemindersHelp:
      "Utilisés pour les nouveaux documents. Vous pouvez personnaliser chaque document.",
    showDetails: "Afficher les détails dans les notifications",
    showDetailsHelp:
      "Désactivé, les notifications n’affichent ni le nom ni le type du document sur l’écran verrouillé.",
    test: "Envoyer une notification de test",
    testScheduled: "Une notification de test arrivera dans quelques secondes.",
    scheduledCount_one: "{{count}} rappel programmé sur cet appareil.",
    scheduledCount_other: "{{count}} rappels programmés sur cet appareil.",
    androidTimingNote:
      "Sur Android, les rappels peuvent arriver quelques minutes après l’heure choisie afin d’économiser la batterie.",
  },
  privacy: {
    title: "Confidentialité",
    headline: "Votre confidentialité compte.",
    intro:
      "Nous enregistrons uniquement les informations nécessaires pour vous rappeler les dates d’expiration.",
    storeTitle: "Ce que nous enregistrons",
    storeItems: {
      account: "Votre adresse e-mail, pour créer et sécuriser votre compte.",
      document:
        "Pour chaque document : son type, un nom de votre choix, la date d’expiration et des notes facultatives.",
      reminders: "Les rappels que vous choisissez pour chaque document.",
    },
    neverTitle: "Ce que nous n’enregistrons jamais",
    neverItems: {
      numbers:
        "Numéros de passeport, de carte d’identité, de permis, de visa ou de sécurité sociale.",
      images:
        "Les images sont traitées sur cet appareil, supprimées après lecture et jamais envoyées ni enregistrées.",
      payment: "Numéros de carte bancaire ou autres données de paiement.",
    },
    whereTitle: "Où sont vos données",
    whereBody:
      "Vos documents sont enregistrés dans votre compte, dans notre base de données dans le cloud, protégés par des règles d’accès pour que vous seul puissiez les lire. Les rappels sont programmés localement sur votre appareil.",
    notesWarning:
      "Merci de ne pas saisir de numéros d’identification dans les noms ou les notes.",
    deleteTitle: "Supprimer vos données",
    deleteBody:
      "Vous pouvez supprimer un document à tout moment, ou supprimer votre compte et tous ses documents depuis les réglages du Compte.",
  },
  account: {
    title: "Compte",
    email: "E-mail",
    deleteAccount: "Supprimer le compte",
    deleteHelp:
      "Supprime définitivement votre compte, tous vos documents et leurs rappels.",
    deleteTitle: "Supprimer votre compte ?",
    deleteMessage:
      "Tous vos documents et rappels seront définitivement supprimés. Cette action est irréversible.",
    deleteConfirmTitle: "En êtes-vous vraiment sûr ?",
    deleteConfirmMessage:
      "Votre compte {{email}} sera supprimé définitivement.",
    deleteConfirmAction: "Supprimer définitivement",
    deleted: "Votre compte a été supprimé.",
  },
  languages: {
    en: "English",
    es: "Español",
    pt: "Português",
    fr: "Français",
  },
  notFound: {
    title: "Page introuvable",
    body: "Cet écran n’existe pas.",
    goHome: "Aller à l’aperçu",
  },
};

export default fr;
