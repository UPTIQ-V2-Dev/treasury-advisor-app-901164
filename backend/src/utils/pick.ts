const pick = (obj: object, keys: string[]) => {
    return keys.reduce<{ [key: string]: unknown }>((finalObj, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (obj && Object.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key as keyof typeof obj];
        }
        return finalObj;
    }, {});
};

export default pick;
