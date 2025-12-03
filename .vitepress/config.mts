import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// Base path is required because GitHub Pages serves multiple doc versions from subdirectories:
//   - https://platform-mesh.github.io/main/          (main branch docs)
//   - https://platform-mesh.github.io/release-0.1/   (release branch docs)
//   - https://platform-mesh.github.io/pr-preview/pr-123/  (PR previews)
//
// VitePress needs to know this base path at build time so all asset URLs (JS, CSS, images)
// and internal links are prefixed correctly. Without it, a page at /main/overview/ would
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
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Overview', link: '/overview' },
      { text: 'Scenarios', link: '/scenarios' },
      { text: 'Get Involved', link: '/get-involved' },
    ],

    logo: {
      src: 'pm_logo.svg',
      width: 24,
      height: 24
    },

    outline: [2, 3, 4, 5],

    search: {
      provider: 'local'
    },

    sidebar: {

      '/overview/': [
        {
            text: 'Overview',
            items: [
            { text: 'Index', link: '/overview/' },
            { text: 'Account Model', link: '/overview/account-model' },
            { text: 'Guiding Principles', link: '/overview/principles' },
            { text: 'Control Planes', link: '/overview/control-planes' },
            { text: 'Design Decisions', link: '/overview/design-decision' },
            ]
        }
      ],

      '/getting-started/': [
        {
            text: 'Getting Started',
            items: [
            { text: 'Index', link: '/getting-started/' },
            { text: 'Quick Start', link: '/getting-started/quick-start' },
            { text: 'Next Steps', link: '/getting-started/next-steps' },
            { text: 'Example MSP', link: '/getting-started/example-msp' },
            { text: 'Troubleshooting', link: '/getting-started/troubleshooting' },
            ]
        }
      ],


        '/scenarios': {
            text: 'Scenarios',
            items:  [
                { text: 'Scenarios', link: '/scenarios' },
                { text: 'Provider to Consumer (P2C)', link: '/scenarios/details.html#provider-to-consumer-p2c' },
                { text: 'Provider to Provider (P2P)', link: '/scenarios/details.html#provider-to-provider-p2p' },
            ],
        },

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/platform-mesh' }
    ]

  },

})
