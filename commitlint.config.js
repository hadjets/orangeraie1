module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'test', 'docs', 'refactor', 'style', 'perf', 'chore', 'ci', 'revert'],
    ],
    'subject-max-length': [2, 'always', 100],
    'subject-case': [0], // Permet les accents français
  },
}
