/* ------------------------------------------------------------------ */
/*  Сховище                                                            */
/*                                                                     */
/*  Оригінал писався під window.storage із середовища артефактів       */
/*  Claude. Тут — той самий async-інтерфейс поверх localStorage, щоб   */
/*  екрани не переписувати:                                            */
/*                                                                     */
/*    get(key)    → { key, value } | null                              */
/*    set(key, v) → true                                               */
/*    delete(key) → true                                               */
/*                                                                     */
/*  Другий аргумент оригінального API (спільний/приватний запис) тут   */
/*  не має сенсу — приймається і ігнорується заради сумісності.        */
/*                                                                     */
/*  Помилки НЕ глушаться: quota exceeded або заблоковане сховище має   */
/*  дійти до UI, інакше користувач думає, що прогрес збережено.        */
/* ------------------------------------------------------------------ */

const PREFIX = "grammar-diagnostic:";

export const KEYS = {
  progress: `${PREFIX}progress:v1`,
  usage: `${PREFIX}usage:v1`,
  attempts: `${PREFIX}attempts:v1`,
  ai: `${PREFIX}ai:v1`,
};

/* Тонка обгортка над localStorage: у приватному вікні або з вимкненими
   cookies звернення до нього кидає ще на доступі до властивості. */
function backend() {
  const ls = globalThis.localStorage;
  if (!ls) throw new Error("localStorage недоступний");
  return ls;
}

export function createStorage(getBackend = backend) {
  return {
    async get(key) {
      const value = getBackend().getItem(key);
      return value === null ? null : { key, value };
    },
    async set(key, value) {
      getBackend().setItem(key, value);
      return true;
    },
    async delete(key) {
      getBackend().removeItem(key);
      return true;
    },
  };
}

export const storage = createStorage();

/* JSON-обгортки: биті дані (наприклад, після ручного редагування
   localStorage) не мають вішати додаток — читання повертає fallback,
   запис лишається строгим. */
export async function readJSON(key, fallback = null, store = storage) {
  try {
    const r = await store.get(key);
    if (!r || !r.value) return fallback;
    return JSON.parse(r.value);
  } catch (e) {
    return fallback;
  }
}

export async function writeJSON(key, data, store = storage) {
  return store.set(key, JSON.stringify(data));
}
