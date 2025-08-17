
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively serializes Firestore data by converting Timestamps to ISO strings.
 * This is necessary to pass data from Server Components to Client Components.
 * @param data The data to serialize.
 * @returns The serialized data.
 */
export const serializeFirestoreData = (data: any): any => {
  if (data === null || data === undefined) {
    return data;
  }

  // Convert Firestore Timestamps to ISO strings
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Recursively process arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  // Recursively process objects, but ignore special Firestore types
  if (typeof data === 'object' && !data.nanoseconds) {
    const serializedData: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serializedData[key] = serializeFirestoreData(data[key]);
      }
    }
    return serializedData;
  }

  return data;
};
