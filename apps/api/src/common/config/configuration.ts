export default () => ({
  port: parseInt(process.env.PORT || '8080', 10),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  frontendUrl: process.env.FRONTEND_URL || '',
  locusApiBaseUrl: process.env.LOCUS_API_BASE_URL || '',
  locusGitBaseUrl: process.env.LOCUS_GIT_BASE_URL || '',
})
