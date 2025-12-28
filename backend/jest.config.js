module.exports = {
    testEnvironment: 'node',
    verbose: true,
    roots: ['<rootDir>/tests'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    testMatch: ['**/*.test.js'],
    // Séparation des tests unitaires et d'intégration
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
            testEnvironment: 'node'
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
            testEnvironment: 'node',
            // Timeout plus long pour les tests d'intégration
            testTimeout: 30000
        }
    ],
    // Fichiers à ignorer
    testPathIgnorePatterns: ['/node_modules/'],
    // Coverage uniquement sur les fichiers src
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js'
    ],
    // Seuils de couverture minimaux
    coverageThreshold: {
        global: {
            branches: 43,
            functions: 50,
            lines: 50,
            statements: 50
        }
    }
};
