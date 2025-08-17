
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This is a robust, recursive function to safely convert Firestore data types
// to JSON-serializable formats. It correctly handles nested objects and Timestamps.
export const serializeFirestoreData = (data: any): any => {
    if (data === null || data === undefined) {
        return data;
    }
    // Firestore Timestamps have a toDate() method.
    if (typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(serializeFirestoreData);
    }
    // This handles nested objects (like the 'bot' field) recursively.
    if (typeof data === 'object' && !data.nanoseconds) { // Added check to exclude Timestamps which are also objects
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
