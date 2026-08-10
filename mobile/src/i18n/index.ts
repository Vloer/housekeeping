import i18nData from '../../../server/i18n/en-us.i18n.json';
export { LanguageProvider, useLanguage, LanguageCode, DICTIONARIES } from './LanguageContext';

export const i18n = i18nData;

/**
 * Replaces placeholders like "{name}" or "{count}" in translation strings with actual values.
 * Example: t(i18n.onboarding.removeHouseholdConfirm, { name: "Cozy Home" })
 */
export function t(template: string, params: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Translates snake_case task keys (e.g., "coffee_machine") to human-readable strings ("Coffee machine").
 * Fallback to original string if key is not found in i18n.tasks (e.g., custom tasks).
 */
export function getTaskName(nameOrKey: string, targetI18n: typeof i18nData = i18nData): string {
  if (targetI18n && targetI18n.tasks && (targetI18n.tasks as Record<string, string>)[nameOrKey]) {
    return (targetI18n.tasks as Record<string, string>)[nameOrKey];
  }
  return nameOrKey;
}

export default i18n;
