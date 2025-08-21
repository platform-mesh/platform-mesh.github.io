import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Platform Mesh",


  description: "Platform Mesh - Building upon the Kubernetes API & Resource Model",

  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(
              new URL('./theme/components/VPFooter.vue', import.meta.url)
          )
        },
        {
          find: /^.*\/VPFeature\.vue$/,
          replacement: fileURLToPath(
              new URL('./theme/components/VPFeature.vue', import.meta.url)
          )
        },
      ]
    }
  },


  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Scenarios', link: '/scenarios' }
    ],

    logo: {
      src: './assets/pm_logo.svg',
      width: 24,
      height: 24
    },
  

    outline: [2, 3, 4, 5],

    search: {
      provider: 'local'
    },

    sidebar: {
        '/scenarios': {
            test: 'Scenarios',
            items:  [
                { text: 'Scenarios', link: '/scenarios' },
                { text: 'Provider to Consumer (P2C)', link: '/scenarios/provider-to-consumer' },
            ],
        },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/platform-mesh' }
    ]
  },
 
})
