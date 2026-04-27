import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './custom.css'
import Term from './components/Term.vue'
import Project from './components/Project.vue'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('Term', Term)
    app.component('Project', Project)
  }
}