import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Platform Mesh",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  // Support versioning: DOCS_VERSION takes precedence, then PAGES_BASE (PR previews), then root
  base: 'DOCS_VERSION' in process.env && process.env.DOCS_VERSION != ''
    ? '/' + process.env.DOCS_VERSION + '/'
    : ('PAGES_BASE' in process.env && process.env.PAGES_BASE != ''
      ? '/' + process.env.PAGES_BASE + '/'
      : '/'),

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
