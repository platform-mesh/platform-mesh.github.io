import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'
import markdownItFootnote from 'markdown-it-footnote'

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

  // Auto-redirect stub pages: any page with `redirect: /new/path` in its frontmatter
  // gets a <meta http-equiv="refresh"> tag injected. Old v0.2 URLs that map to a
  // single new location use this to bounce visitors automatically; the visible
  // "moved" copy stays as a fallback for browsers that ignore meta refresh.
  transformPageData(pageData) {
    const redirect = pageData.frontmatter?.redirect
    if (redirect) {
      const url = base + String(redirect).replace(/^\//, '')
      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head || []),
        ['meta', { 'http-equiv': 'refresh', content: `0; url=${url}` }]
      ]
    }
  },

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
            { text: 'Explore the example MSP', link: '/tutorials/explore-example-msp' },
            { text: 'Provider quick start', link: '/tutorials/provider-quick-start' },
            { text: 'Consume a service from a controller', link: '/tutorials/consume-service-from-controller' },
            { text: 'Build a multicluster-runtime provider', link: '/tutorials/build-multicluster-runtime-provider' },
            ]
        }
      ],

      '/how-to-guides/': [
        {
            text: 'Set up and run',
            items: [
            { text: 'Set up Platform Mesh locally', link: '/how-to-guides/set-up-platform-mesh-locally' },
            { text: 'Speed up local rebuilds', link: '/how-to-guides/speed-up-local-rebuilds' },
            ]
        },
        {
            text: 'Access local services',
            items: [
            { text: 'Access the Keycloak admin console', link: '/how-to-guides/access-keycloak' },
            { text: 'Access the OpenFGA playground', link: '/how-to-guides/access-openfga' },
            { text: 'Access the kcp admin workspace', link: '/how-to-guides/access-kcp-admin' },
            ]
        },
        {
            text: 'Operate the local setup',
            items: [
            { text: 'Troubleshoot the local setup', link: '/how-to-guides/troubleshoot-local-setup' },
            ]
        }
      ],

      '/concepts/': [
        {
            text: 'Foundations',
            items: [
            { text: 'Why Platform Mesh?', link: '/concepts/why-platform-mesh' },
            { text: 'Architecture', link: '/concepts/architecture' },
            { text: 'Personas', link: '/concepts/personas/' },
            ]
        },
        {
            text: 'Account and control plane',
            items: [
            { text: 'Account model', link: '/concepts/account-model' },
            { text: 'Control planes and workspaces', link: '/concepts/control-planes' },
            { text: 'Identity and authorization', link: '/concepts/identity-and-authorization' },
            ]
        },
        {
            text: 'Security architecture',
            items: [
            { text: 'Overview', link: '/concepts/security/' },
            { text: 'Authentication', link: '/concepts/security/authentication' },
            { text: 'Authorization', link: '/concepts/security/authorization' },
            ]
        },
        {
            text: 'API and integration',
            items: [
            { text: 'API sharing', link: '/concepts/api-sharing' },
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
            { text: 'multicluster-runtime', link: '/concepts/integration/multicluster-runtime' },
            ]
        }
      ],

      '/reference/': [
        {
            text: 'Platform Mesh runtime',
            items: [
            {
              text: 'kcp',
              link: '/reference/components/kcp',
              collapsed: false,
              items: [
                { text: 'Workspaces', link: '/reference/components/kcp/workspaces' },
                { text: 'API sharing', link: '/reference/components/kcp/api-sharing' },
                { text: 'Identity and authorization', link: '/reference/components/kcp/identity-and-authorization' },
                { text: 'Virtual workspaces', link: '/reference/components/kcp/virtual-workspaces' },
                { text: 'Watch and sync', link: '/reference/components/kcp/watch-and-sync' },
                { text: 'Sharding', link: '/reference/components/sharding' },
                { text: 'kcp-operator', link: '/reference/components/kcp-operator' },
              ],
            },
            { text: 'Platform Mesh operator', link: '/reference/components/platform-mesh-operator' },
            { text: 'Account operator', link: '/reference/components/account-operator' },
            { text: 'Security operator', link: '/reference/components/security-operator' },
            { text: 'IAM service', link: '/reference/components/iam-service' },
            { text: 'IAM UI', link: '/reference/components/iam-ui' },
            { text: 'Keycloak', link: '/reference/components/keycloak' },
            { text: 'OpenFGA', link: '/reference/components/openfga' },
            { text: 'rebac-authz-webhook', link: '/reference/components/rebac-authz-webhook' },
            { text: 'Kubernetes GraphQL gateway', link: '/reference/components/kubernetes-graphql-gateway' },
            { text: 'Portal', link: '/reference/components/portal' },
            { text: 'Marketplace', link: '/reference/components/marketplace' },
            { text: 'virtual-workspaces', link: '/reference/components/virtual-workspaces' },
            ]
        },
        {
            text: 'Integration paths',
            items: [
            { text: 'api-syncagent', link: '/reference/components/api-syncagent' },
            { text: 'multicluster-runtime', link: '/reference/components/multicluster-runtime' },
            ]
        },
        {
            text: 'Resources',
            link: '/reference/resources/',
            items: [
            { text: 'Account resource', link: '/reference/resources/account-resource' },
            { text: 'IAM Store resource', link: '/reference/resources/iamstore-resource' },
            { text: 'ContentConfiguration', link: '/reference/resources/content-configuration' },
            { text: 'Metadata catalog', link: '/reference/resources/metadata-catalog' },
            ]
        },
        {
            text: 'Security',
            link: '/reference/security/',
            items: [
            { text: 'OpenSSF Scorecard', link: '/reference/security/scorecard' },
            ]
        }
      ],

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/platform-mesh' }
    ]

  },

  markdown: {
    config: (md) => {
      md.use(markdownItFootnote)
    }
  },

})
