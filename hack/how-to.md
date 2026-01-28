# Documentation Versioning - How-To Guide

This guide explains how to use the versioning system for Platform Mesh documentation, including local testing and GitHub deployment.

## Overview

The documentation uses a **branch-based versioning system**:
- `main` branch → Deployed to `/main/` (latest development docs)
- `release-*` branches → Deployed to `/release-X.Y/` (stable release docs)
- PR previews → Deployed to `/pr-preview/pr-{number}/` (unchanged)

Each version is independently deployable and maintains its own content while sharing the same VitePress theme and configuration.

## Local Testing

### Quick Test (Single Version)

Test one version at a time to verify builds work correctly:

```bash
# Test main version
DOCS_VERSION=main npm run build
npm run preview
# Open: http://localhost:4173/main/
```

```bash
# Test release version
DOCS_VERSION=release-0.2 npm run build
npm run preview
# Open: http://localhost:4173/release-0.2/
```

**What to check:**
- ✅ Page loads without errors
- ✅ All styling looks correct
- ✅ Version selector dropdown appears in navigation
- ✅ Navigation links work properly
- ✅ Images and assets load

**Limitation:** Version switching won't work because only one version exists in the build output at a time.

### Full Test (Version Switching)

Test the complete version switching functionality:

```bash
# 1. Build main version
DOCS_VERSION=main npm run build
mkdir -p test-deploy/main
cp -r .vitepress/dist/* test-deploy/main/

# 2. Build release-0.2 version
DOCS_VERSION=release-0.2 npm run build
mkdir -p test-deploy/release-0.2
cp -r .vitepress/dist/* test-deploy/release-0.2/

# 3. Serve both versions
cd test-deploy
python3 -m http.server 8080
```

**Open in browser:**
- `http://localhost:8080/main/` - Main version
- `http://localhost:8080/release-0.2/` - Release version

**What to check:**
- ✅ Both URLs load correctly
- ✅ Version selector shows all versions
- ✅ Switching versions works (dropdown navigates to different version)
- ✅ Current version is highlighted in dropdown
- ✅ Switching preserves current page path (e.g., `/main/overview/` → `/release-0.2/overview/`)

**Cleanup after testing:**
```bash
cd ..
rm -rf test-deploy/
```

### Development Server

For actively developing documentation content:

```bash
npm run dev
# Open: http://localhost:5173/
```

**Note:** The dev server doesn't use versioned paths. Use this for:
- Writing and previewing content
- Testing theme changes
- Rapid iteration on markdown files

For version-specific testing, always use the build + preview method.

## GitHub Deployment

### Initial Setup (One-Time)

The versioning system is already configured. The GitHub Actions workflow (`.github/workflows/pages.yaml`) handles:
- Building documentation for version branches
- Deploying to GitHub Pages
- Managing PR previews

**Prerequisites:**
- GitHub Pages must be enabled (Settings → Pages)
- Deploy from `gh-pages` branch
- Workflow has `contents: write` permission

### Deploying Main Branch

Pushing to `main` automatically deploys the latest docs:

```bash
# Make changes to documentation
git checkout main
# ... edit markdown files ...
git add .
git commit -m "Update documentation"
git push origin main
```

**What happens:**
1. GitHub Actions workflow triggers
2. Builds with `DOCS_VERSION=main`
3. Deploys to `gh-pages` branch under `/main/` directory
4. Available at: `https://platform-mesh.github.io/main/`

**Monitor deployment:**
- Go to repository → **Actions** tab
- Click on the running workflow
- Wait for ✅ completion (typically 1-2 minutes)
- Check deployment at your GitHub Pages URL

### Creating a Release Branch

When you're ready to create a stable release version:

```bash
# 1. Start from latest main
git checkout main
git pull origin main

# 2. Create release branch (use pattern: release-X.Y)
git checkout -b release-0.2

# 3. Push to GitHub
git push -u origin release-0.2
```

**What happens:**
1. GitHub Actions workflow automatically triggers (matches `release-*` pattern)
2. Extracts version from branch name: `release-0.2`
3. Builds with `DOCS_VERSION=release-0.2`
4. Deploys to `gh-pages` branch under `/release-0.2/` directory
5. Available at: `https://platform-mesh.github.io/release-0.2/`

**Verify deployment:**
1. Check **Actions** tab for workflow run
2. Wait for completion
3. Visit `https://platform-mesh.github.io/release-0.2/`
4. Verify content is correct

### Updating the Version Selector

After creating a new release branch, add it to the dropdown:

```bash
# 1. Edit the version selector component
git checkout main
```

Edit `.vitepress/theme/components/VersionSelector.vue`:

```typescript
const versions: Version[] = [
  { name: 'main', label: 'main (latest)' },
  { name: 'release-0.3', label: 'v0.3' },  // Add new versions here
  { name: 'release-0.2', label: 'v0.2' },
  { name: 'release-0.1', label: 'v0.1' },
]
```

```bash
# 2. Commit and push
git add .vitepress/theme/components/VersionSelector.vue
git commit -m "Add release-0.3 to version selector"
git push origin main
```

**Apply to other branches (optional):**
```bash
# Update the dropdown on release branches too
git checkout release-0.2
git cherry-pick <commit-hash-from-main>
git push origin release-0.2
```

### Updating Release Documentation

To fix or update a specific release version:

```bash
# 1. Checkout the release branch
git checkout release-0.2

# 2. Make changes
# ... edit markdown files ...

# 3. Commit and push
git add .
git commit -m "Fix typo in release-0.2 docs"
git push origin release-0.2
```

**What happens:**
- Workflow triggers automatically
- Rebuilds only the `release-0.2` version
- Redeploys to `/release-0.2/` (overwrites previous deployment)
- Other versions (main, release-0.3, etc.) are unaffected

## Pull Request Previews

PR previews continue to work as before, completely independent of versioning.

### How It Works

When you open a PR to `main`:

```bash
# 1. Create a feature branch
git checkout -b feature/my-changes
# ... make changes ...
git add .
git commit -m "Add new feature documentation"
git push origin feature/my-changes

# 2. Open PR on GitHub
# Go to repository → Pull Requests → New Pull Request
```

**What happens:**
1. Workflow triggers on PR events (opened, synchronized)
2. Builds with `PAGES_BASE=pr-preview/pr-{number}` (NOT `DOCS_VERSION`)
3. Deploys to `/pr-preview/pr-{number}/` on `gh-pages` branch
4. Bot comments on PR with preview URL

**Preview URL:**
`https://platform-mesh.github.io/pr-preview/pr-{number}/`

**Verify PR preview:**
1. Open the PR on GitHub
2. Wait for workflow to complete
3. Click the preview URL in the bot comment
4. Review your changes before merging

### PR Preview vs Versioning

**Key differences:**

| Feature | PR Preview | Version Branches |
|---------|------------|------------------|
| Trigger | Pull request events | Push to main/release-* |
| Environment Variable | `PAGES_BASE` | `DOCS_VERSION` |
| Base Path | `/pr-preview/pr-{number}/` | `/main/` or `/release-X.Y/` |
| Persistence | Deleted when PR closes | Permanent until branch deleted |
| Purpose | Review changes | Stable documentation |

**They coexist without conflict:**
- PR previews use `PAGES_BASE` environment variable
- Version branches use `DOCS_VERSION` environment variable
- VitePress config checks `DOCS_VERSION` first, then `PAGES_BASE`
- Different concurrency groups prevent deployment conflicts

### Testing PR Previews

To verify PR preview functionality still works:

```bash
# 1. Create a test branch
git checkout -b test-pr-preview
echo "# Test PR Preview" >> test-file.md
git add test-file.md
git commit -m "Test PR preview deployment"
git push origin test-pr-preview

# 2. Open PR on GitHub

# 3. Wait for workflow and check preview URL

# 4. Verify preview works, then close PR
```

## Troubleshooting

### Build Fails Locally

**Problem:** `npm run build` fails with errors

**Solutions:**
1. Clear VitePress cache:
   ```bash
   rm -rf .vitepress/cache .vitepress/dist
   npm run build
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. Check for syntax errors in Vue components or config files

### Version Selector Not Showing

**Problem:** Dropdown doesn't appear in navigation

**Check:**
1. Verify `Layout.vue` is being used:
   ```bash
   cat .vitepress/theme/index.js
   # Should show: ...DefaultTheme, Layout,
   ```

2. Check browser console for JavaScript errors

3. Rebuild:
   ```bash
   DOCS_VERSION=main npm run build
   npm run preview
   ```

### Version Switching Shows 404

**Problem:** Clicking version in dropdown shows "Page Not Found"

**Local testing:**
- You need BOTH versions deployed to `test-deploy/` directory
- Follow "Full Test (Version Switching)" steps exactly

**On GitHub:**
- Verify both branches have been deployed
- Check Actions tab for successful deployments
- Verify URLs work independently:
  - `https://platform-mesh.github.io/main/`
  - `https://platform-mesh.github.io/release-0.2/`

### Workflow Not Triggering

**Problem:** Push to branch doesn't trigger workflow

**Check:**
1. Branch name matches pattern:
   - ✅ `main` - triggers
   - ✅ `release-0.2` - triggers (matches `release-*`)
   - ✅ `release-1.0` - triggers
   - ❌ `rel-0.2` - doesn't match pattern
   - ❌ `v0.2` - doesn't match pattern

2. Workflow file is on the branch:
   ```bash
   git checkout <branch>
   ls .github/workflows/pages.yaml
   ```

3. Check Actions tab for errors or disabled workflows

### PR Preview Not Deploying

**Problem:** PR preview workflow runs but doesn't deploy

**Check:**
1. PR is from same repository (not a fork):
   - Workflow has `!github.event.pull_request.head.repo.fork` check
   - Fork PRs won't deploy for security reasons

2. Check workflow run logs in Actions tab

3. Verify `pr-preview` directory not in `.gitignore`

### Assets Not Loading (404s)

**Problem:** Images or CSS not loading, showing 404 errors

**Cause:** Base path mismatch

**Check:**
1. Build was done with correct `DOCS_VERSION`:
   ```bash
   DOCS_VERSION=main npm run build
   ```

2. Serving from correct path:
   - `http://localhost:4173/main/` (not `http://localhost:4173/`)

3. Markdown image paths are relative or use proper base path

### Styles Broken After Update

**Problem:** Site loads but styling is completely wrong

**Check:**
1. Theme export structure in `.vitepress/theme/index.js`:
   ```javascript
   export default {
     ...DefaultTheme,  // Must spread DefaultTheme
     Layout,
   }
   ```

2. Custom CSS is imported:
   ```javascript
   import './custom.css'
   ```

3. Clear cache and rebuild:
   ```bash
   rm -rf .vitepress/cache
   npm run build
   ```

## Workflow Reference

### GitHub Actions Environment Variables

The workflow automatically sets these based on context:

| Branch | `DOCS_VERSION` | `PAGES_BASE` | Deploy Path |
|--------|----------------|--------------|-------------|
| `main` | `main` | (empty) | `/main/` |
| `release-0.2` | `release-0.2` | (empty) | `/release-0.2/` |
| PR to main | (empty) | `pr-preview/pr-{number}` | `/pr-preview/pr-{number}/` |

### Concurrency Groups

Deployments use separate concurrency groups to prevent conflicts:

- Main: `pages-main`
- Release branches: `pages-release-0.2`, `pages-release-0.3`, etc.
- PR previews: `pages-preview-123`, `pages-preview-456`, etc.

This allows:
- Multiple versions to deploy simultaneously
- PR previews to deploy while version deploys are running
- No race conditions or overwriting

### Manual Workflow Trigger

You can manually trigger deployment from Actions tab:

1. Go to repository → **Actions**
2. Select "pages" workflow
3. Click **Run workflow**
4. Select branch to deploy
5. Click **Run workflow** button

Useful for:
- Redeploying after GitHub Pages issues
- Testing workflow changes
- Forcing a rebuild without code changes

## Best Practices

### Version Naming

Use consistent naming for release branches:
- ✅ `release-0.2`, `release-0.3`, `release-1.0`
- ✅ `release-2024.1`, `release-2024.2`
- ❌ `v0.2`, `0.2`, `rel-0.2` (won't trigger workflow)

### When to Create Release Branches

Create a release branch when:
- Major feature is complete and stable
- Ready to freeze documentation for a release
- Need to maintain docs for older versions
- Creating a new product version

Don't create release branches for:
- Every commit or small change
- Work-in-progress features
- Experimental documentation

### Maintaining Multiple Versions

**Update all versions** for:
- Critical bug fixes
- Security updates
- Broken links or errors

**Update only specific versions** for:
- Version-specific features
- Deprecated functionality (remove from new versions)
- Different behavior between versions

**Example workflow:**
```bash
# Fix critical typo in all versions
git checkout main
# ... fix typo ...
git commit -m "Fix critical typo"
git push origin main

# Cherry-pick to release branches
git checkout release-0.2
git cherry-pick <commit-hash>
git push origin release-0.2

git checkout release-0.3
git cherry-pick <commit-hash>
git push origin release-0.3
```

### Version Selector Management

**Keep it updated:**
- Add new versions to dropdown when created
- List versions in reverse chronological order (newest first, except main)
- Use clear labels (`main (latest)`, `v0.3`, `v0.2`)

**Remove old versions:**
1. Delete the branch: `git push origin --delete release-0.1`
2. Remove from dropdown in `VersionSelector.vue`
3. Optionally: manually delete from `gh-pages` branch

### Testing Before Merging

Always test locally before pushing:

```bash
# 1. Build and test locally
DOCS_VERSION=main npm run build
npm run preview

# 2. Check for issues
# - Broken links
# - Missing images
# - Formatting problems

# 3. If good, push to GitHub
git push origin main
```

## Summary

**Local Testing:**
- Quick: `DOCS_VERSION=main npm run build && npm run preview`
- Full: Build both versions to `test-deploy/`, serve with `python3 -m http.server`

**GitHub Deployment:**
- Main: Push to `main` → deploys to `/main/`
- Release: Push to `release-X.Y` → deploys to `/release-X.Y/`
- PR Preview: Open PR → deploys to `/pr-preview/pr-{number}/`

**All three coexist independently without conflicts!**

For questions or issues, check the troubleshooting section or review workflow logs in the Actions tab.
