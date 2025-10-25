import Joi from 'joi';

export const password: Joi.CustomValidator<string> = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message({ custom: 'password must be at least 8 characters' });
    }
    if (!value.match(/[a-zA-Z]/)) {
        return helpers.message({ custom: 'password must contain at least 1 letter' });
    }
    if (!value.match(/\d/)) {
        return helpers.message({ custom: 'password must contain at least 1 number' });
    }
    return value;
};

export const objectId: Joi.CustomValidator<string> = (value, helpers) => {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.message({ custom: 'must be a valid mongo id' });
    }
    return value;
};
