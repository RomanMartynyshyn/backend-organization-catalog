const EARTH_KM_PER_LATITUDE_DEGREE = 111.32;

export function getBoundingBox({ lat, lng, radiusKm }) {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusInKm = Number(radiusKm);

    const latDelta = radiusInKm / EARTH_KM_PER_LATITUDE_DEGREE;
    const minLat = clampLatitude(latitude - latDelta);
    const maxLat = clampLatitude(latitude + latDelta);

    const cosine = Math.cos((latitude * Math.PI) / 180);
    const lngDivider = Math.abs(cosine) < Number.EPSILON
        ? Number.EPSILON
        : EARTH_KM_PER_LATITUDE_DEGREE * cosine;
    const lngDelta = radiusInKm / Math.abs(lngDivider);
    const rawMinLng = longitude - lngDelta;
    const rawMaxLng = longitude + lngDelta;

    return {
        minLat,
        maxLat,
        minLng: normalizeLongitude(rawMinLng),
        maxLng: normalizeLongitude(rawMaxLng)
    };
}

function clampLatitude(value) {
    return Math.min(90, Math.max(-90, value));
}

function normalizeLongitude(value) {
    if (value < -180) {
        return ((value + 180) % 360 + 360) % 360 - 180;
    }

    if (value > 180) {
        return ((value + 180) % 360) - 180;
    }

    return value;
}