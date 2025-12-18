
// Mock Logistics Service
// In a real app, this would query a carrier API (CDEK, Russian Post, etc.)

export type Region = 'Moscow' | 'Saint-Petersburg' | 'Novosibirsk' | 'Ekaterinburg' | 'Vladivostok' | 'Other';

interface DeliveryEstimate {
    daysMin: number;
    daysMax: number;
    price: number;
}

const ZONES: Record<string, number> = {
    'Moscow': 0,
    'Saint-Petersburg': 1,
    'Ekaterinburg': 2,
    'Novosibirsk': 3,
    'Vladivostok': 7,
    'Other': 4
};

export const calculateDelivery = (from: Region, to: Region = 'Moscow', weightKg: number = 1): DeliveryEstimate => {
    const fromZone = ZONES[from] || 4;
    const toZone = ZONES[to] || 4;

    // Simple zone-based math
    const distDiff = Math.abs(fromZone - toZone);

    let daysMin = 1 + distDiff; // Base 1 day + distance
    let daysMax = daysMin + 2;

    // Price calculation (Base 200r + 50r per zone diff + 30r per kg)
    let price = 200 + (distDiff * 50) + (weightKg * 30);

    // Special cases
    if (from === to) {
        daysMin = 1;
        daysMax = 1;
        price = 150 + (weightKg * 20); // Intra-city
    }

    return {
        daysMin,
        daysMax,
        price
    };
};

export const formatDeliveryDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};
