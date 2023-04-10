module.exports = {
    branches: ['main'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/changelog', [
            '@semantic-release/npm',
            {
                tarballDir: 'dist',
                npmPublish: true,
                pkgRoot: '.',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: 'release/*.tgz',
            },
        ],
        '@semantic-release/git',
    ],
};