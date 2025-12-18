const { body } = require('express-validator');

exports.depositValidator = [
    body('montant')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ gt: 0 }).withMessage('Le montant doit être supérieur à 0'),
    body('source')
        .optional()
        .isString().withMessage('La source doit être une chaîne de caractères')
];

exports.withdrawValidator = [
    body('montant')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ gt: 0 }).withMessage('Le montant doit être supérieur à 0'),
    body('pin')
        .notEmpty().withMessage('Le PIN est requis')
        .isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres')
        .isNumeric().withMessage('Le PIN doit être numérique')
];

exports.transferValidator = [
    body('montant')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ gt: 0 }).withMessage('Le montant doit être supérieur à 0'),
    body('telephoneDestinataire')
        .notEmpty().withMessage('Le numéro du destinataire est requis')
        .isString(),
    body('pin')
        .notEmpty().withMessage('Le PIN est requis')
        .isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres')
        .isNumeric().withMessage('Le PIN doit être numérique')
];

exports.merchantPaymentValidator = [
    body('montant')
        .notEmpty().withMessage('Le montant est requis')
        .isFloat({ gt: 0 }).withMessage('Le montant doit être supérieur à 0'),
    body('codeMarchand')
        .notEmpty().withMessage('Le code marchand est requis'),
    body('pin')
        .notEmpty().withMessage('Le PIN est requis')
        .isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres')
        .isNumeric().withMessage('Le PIN doit être numérique')
];
