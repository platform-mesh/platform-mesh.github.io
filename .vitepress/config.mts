import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// Base path is required because GitHub Pages serves multiple doc versions from subdirectories:
//   - https://platform-mesh.github.io/main/          (main branch docs)
//   - https://platform-mesh.github.io/release-0.1/   (release branch docs)
//   - https://platform-mesh.github.io/pr-preview/pr-123/  (PR previews)
//
// VitePress needs to know this base path at build time so all asset URLs (JS, CSS, images)
// and internal links are prefixed correctly. Without it, a page at /main/concepts/ would
// try to load assets from / instead of /main/, causing 404 errors.
//
// The GitHub Actions workflow sets these env vars before running `npm run build`:
//   - DOCS_VERSION: Set for version branches (main, release-*)
//   - PAGES_BASE: Set for PR preview builds
//
// Priority: DOCS_VERSION > PAGES_BASE > "/" (local dev fallback)
const base = 'DOCS_VERSION' in process.env && process.env.DOCS_VERSION != ''
  ? '/' + process.env.DOCS_VERSION + '/'
  : ('PAGES_BASE' in process.env && process.env.PAGES_BASE != ''
    ? '/' + process.env.PAGES_BASE + '/'
    : '/');

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Platform Mesh",
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.ico` }]
  ],

  base,

  description: "Platform Mesh - Building upon the Kubernetes API & Resource Model",

  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(
              new URL('theme/components/VPFooter.vue', import.meta.url)
          )
        },
        {
          find: /^.*\/VPFeature\.vue$/,
          replacement: fileURLToPath(
              new URL('theme/components/VPFeature.vue', import.meta.url)
          )
        },
      ]
    }
  },


  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tutorials', link: '/tutorials/' },
      { text: 'How-to guides', link: '/how-to-guides/' },
      { text: 'Concepts', link: '/concepts/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Get involved', link: '/get-involved' },
    ],

    logo: {
      src: '/pm_logo.svg',
      width: 24,
      height: 24
    },

    outline: [2, 3, 4, 5],

    search: {
      provider: 'local'
    },

    sidebar: {

      '/tutorials/': [
        {
            text: 'Tutorials',
            items: [
            { text: 'Learning path', link: '/tutorials/' },
            { text: 'Run Platform Mesh locally', link: '/tutorials/run-platform-mesh-locally' },
            { text: 'Explore the example MSP', link: '/tutorials/explore-example-msp' },
            { text: 'Provider quick start', link: '/tutorials/provider-quick-start' },
            ]
        }
      ],

      '/how-to-guides/': [
        {
            text: 'How-to guides',
            items: [
            { text: 'Access kcp admin', link: '/how-to-guides/access-kcp-admin' },
            { text: 'Access Keycloak', link: '/how-to-guides/access-keycloak' },
            { text: 'Access OpenFGA', link: '/how-to-guides/access-openfga' },
            { text: 'Troubleshoot local setup', link: '/how-to-guides/troubleshoot-local-setup' },
            ]
        }
      ],

      '/concepts/': [
        {
            text: 'Concepts',
            items: [
            { text: 'Why Platform Mesh?', link: '/concepts/why-platform-mesh' },
            { text: 'Architecture', link: '/concepts/architecture' },
            { text: 'Personas', link: '/concepts/personas' },
            { text: 'Account model', link: '/concepts/account-model' },
            { text: 'Control planes', link: '/concepts/control-planes' },
            { text: 'API sharing', link: '/concepts/api-sharing' },
            { text: 'Identity and authorization', link: '/concepts/identity-and-authorization' },
            { text: 'Integration paths', link: '/concepts/integration-paths' },
            ]
        },
        {
            text: 'Interaction patterns',
            items: [
            { text: 'Provider to consumer', link: '/concepts/interaction-patterns/provider-to-consumer' },
            { text: 'Provider to provider', link: '/concepts/interaction-patterns/provider-to-provider' },
            { text: 'Cross-consumption', link: '/concepts/interaction-patterns/cross-consumption' },
            ]
        },
        {
            text: 'Integration',
            items: [
            { text: 'api-syncagent', link: '/concepts/integration/api-syncagent' },
            { text: 'multi-cluster-runtime', link: '/concepts/integration/multi-cluster-runtime' },
            ]
        }
      ],

      '/reference/': [
        {
            text: 'Reference',
            items: [
            { text: 'Resources and metadata', link: '/reference/resources/' },
            { text: 'Components', link: '/reference/components/' },
            ]
        },
        {
            text: 'Resources and metadata',
            items: [
            { text: 'Account resource', link: '/reference/resources/account-resource' },
            { text: 'ContentConfiguration', link: '/reference/resources/content-configuration' },
            { text: 'Annotation catalog', link: '/reference/resources/annotation-catalog' },
            ]
        },
        {
            text: 'Components',
            items: [
            { text: 'kcp', link: '/reference/components/kcp' },
            { text: 'Platform Mesh operator', link: '/reference/components/platform-mesh-operator' },
            { text: 'Account operator', link: '/reference/components/account-operator' },
            { text: 'Security operator', link: '/reference/components/security-operator' },
            { text: 'Kubernetes GraphQL gateway', link: '/reference/components/kubernetes-graphql-gateway' },
            { text: 'Portal', link: '/reference/components/portal' },
            { text: 'IAM', link: '/reference/components/iam' },
            { text: 'Marketplace', link: '/reference/components/marketplace' },
            { text: 'Keycloak', link: '/reference/components/keycloak' },
            { text: 'OpenFGA', link: '/reference/components/openfga' },
            { text: 'rebac-authz-webhook', link: '/reference/components/rebac-authz-webhook' },
            { text: 'api-syncagent', link: '/reference/components/api-syncagent' },
            { text: 'multi-cluster-runtime', link: '/reference/components/multi-cluster-runtime' },
            ]
        }
      ],

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/platform-mesh' }
    ]

  },

})
