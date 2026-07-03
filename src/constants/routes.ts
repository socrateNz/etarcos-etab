/** Routes publiques (sans authentification) */
export const PUBLIC_ROUTES = ["/login", "/register"] as const;

/** Route par défaut après connexion */
export const DEFAULT_AUTH_REDIRECT = "/dashboard";

/** Préfixe des routes API */
export const API_PREFIX = "/api";
