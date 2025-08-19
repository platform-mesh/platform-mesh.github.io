import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Platform Mesh",
  description: "Platform Mesh establishes interoperability between multiple providers",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Scenarios', link: '/scenarios' }
    ],

    outline: [2, 3, 4, 5],

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
 markdown: {
    config: md => {
      md.renderer.rules.fence = (tokens, index, options, env, slf) => {
        const token = tokens[index]
        if (token.info.trim() === 'mermaid') {
          const key = index
          return `
          <Suspense>
            <template #default>
              <Mermaid id="mermaid-${key}"  graph="${token.content}"></Mermaid>
            </template>
            <template #fallback>
              Loading...
            </template>
          </Suspense>
`
        }
      }
    }
 },
})
