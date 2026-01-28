# Verifying GitHub Pages Deployment

After pushing to GitHub, here's how to verify the versioning deployment worked correctly:

## 1. Check Workflow Execution

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Find the workflow run for your push
4. Click on it to see details
5. Verify all steps completed successfully (green checkmarks)

Look for these steps:
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ npm ci
- ✅ npm run build (with DOCS_VERSION set)
- ✅ Deploy to GitHub Pages

## 2. Inspect the gh-pages Branch

### Via GitHub Web Interface

1. Go to your repository
2. Click the branch dropdown (usually shows "main")
3. Select `gh-pages` branch
4. You should see directory structure like:

```
gh-pages (branch)
├── main/
│   ├── index.html
│   ├── assets/
│   │   ├── app.xxx.js
│   │   ├── chunks/
│   │   └── ...
│   ├── overview/
│   ├── scenarios/
│   └── ...
├── release-0.2/
│   ├── index.html
│   ├── assets/
│   └── ...
└── pr-preview/  (if PRs exist)
```

### Via Git Locally

```bash
# Fetch the gh-pages branch
git fetch origin gh-pages

# Checkout gh-pages branch (don't worry, you can switch back)
git checkout gh-pages

# List directory structure
ls -la
# Should show: main/, release-0.2/, etc.

# Check main version files
ls -la main/
# Should show: index.html, assets/, overview/, scenarios/, etc.

# Check release version files
ls -la release-0.2/
# Should show: index.html, assets/, overview/, scenarios/, etc.

# Switch back to your working branch
git checkout main
```

## 3. Test the Deployed URLs

### Main Version
Visit: `https://platform-mesh.github.io/main/`

**Check:**
- ✅ Page loads without 404 error
- ✅ Styling is correct
- ✅ Navigation works (Home, Overview, Scenarios)
- ✅ Version selector dropdown shows in nav bar
- ✅ Logo and images load correctly

**Test navigation:**
- Click "Overview" → Should go to `https://platform-mesh.github.io/main/overview/`
- Click "Scenarios" → Should go to `https://platform-mesh.github.io/main/scenarios`
- Click logo → Should return to `https://platform-mesh.github.io/main/`

### Release Version
Visit: `https://platform-mesh.github.io/release-0.2/`

**Check:**
- ✅ Page loads without 404 error
- ✅ All styling and navigation works
- ✅ Version selector shows both "main (latest)" and "v0.2"

### Version Switching
From `https://platform-mesh.github.io/main/overview/`:
1. Click version dropdown
2. Select "v0.2"
3. Should navigate to `https://platform-mesh.github.io/release-0.2/overview/`
4. Current page path is preserved!

From `https://platform-mesh.github.io/release-0.2/`:
1. Click version dropdown
2. Select "main (latest)"
3. Should navigate to `https://platform-mesh.github.io/main/`

## 4. Check PR Previews Still Work

### Create a Test PR

```bash
git checkout main
git checkout -b test-pr-preview
echo "# Test" >> test.md
git add test.md
git commit -m "Test PR preview"
git push origin test-pr-preview
```

### Open PR and Verify

1. Go to repository → **Pull Requests** → **New Pull Request**
2. Select `test-pr-preview` branch
3. Create PR
4. Wait for workflow to complete
5. Check for bot comment with preview URL

**Test preview URL:**
`https://platform-mesh.github.io/pr-preview/pr-{number}/`

**Verify:**
- ✅ PR preview loads correctly
- ✅ Shows your changes
- ✅ Independent from version deployments
- ✅ Version selector may show (but won't switch correctly in PR preview)

**Close test PR:**
- Close the PR on GitHub
- Delete the branch: `git branch -D test-pr-preview && git push origin --delete test-pr-preview`

## 5. Common Issues and Solutions

### Issue: 404 on Main URL

**Problem:** `https://platform-mesh.github.io/main/` returns 404

**Check:**
1. Is GitHub Pages enabled? (Settings → Pages)
2. Is it deploying from `gh-pages` branch?
3. Did the workflow complete successfully?
4. Wait a few minutes (DNS propagation)

**Solution:**
```bash
# Verify gh-pages branch exists and has content
git fetch origin gh-pages
git checkout gh-pages
ls -la main/
```

If `main/` directory doesn't exist, the deployment didn't work. Check workflow logs.

### Issue: Styling Broken

**Problem:** Page loads but looks completely unstyled

**Check:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for 404 errors on CSS/JS files

**Common cause:** Base path mismatch

**Verify in workflow logs:**
```
Run npm run build
  env:
    DOCS_VERSION: main      # ← Should show the version
```

If `DOCS_VERSION` is empty or wrong, the build had wrong base path.

### Issue: Assets Not Loading

**Problem:** Images showing broken icon, CSS not applying

**Check DevTools console:**
- Are asset URLs correct? Should be `/main/assets/...`
- Are assets returning 404?

**Verify on gh-pages branch:**
```bash
git checkout gh-pages
ls -la main/assets/
# Should show: app.xxx.js, chunks/, etc.
```

### Issue: Version Selector Not Working

**Problem:** Dropdown shows but clicking doesn't navigate

**On main version:**
1. Open `https://platform-mesh.github.io/main/`
2. Open DevTools → Console
3. Check for JavaScript errors
4. Click dropdown
5. Select "v0.1"

**If 404 occurs:**
- Verify `release-0.2` branch was deployed
- Check `https://platform-mesh.github.io/release-0.2/` loads independently
- Check gh-pages branch has `release-0.2/` directory

### Issue: Workflow Not Triggering

**Problem:** Push to branch doesn't trigger deployment

**Check workflow file on that branch:**
```bash
git checkout release-0.2
cat .github/workflows/pages.yaml
```

The workflow file must exist on the branch for it to trigger!

**If missing:**
```bash
# Merge the workflow changes to the release branch
git checkout release-0.2
git merge main .github/workflows/pages.yaml
git commit -m "Add versioning workflow"
git push origin release-0.2
```

## 6. GitHub Pages Settings

Verify your GitHub Pages configuration:

1. Go to repository **Settings**
2. Scroll to **Pages** section (under "Code and automation")
3. **Source:** Should be "Deploy from a branch"
4. **Branch:** Should be `gh-pages` and `/ (root)`
5. **Custom domain:** (optional, leave blank if not using)

**Important:** The URL shown there is just `https://platform-mesh.github.io/`, but your docs are at:
- `https://platform-mesh.github.io/main/`
- `https://platform-mesh.github.io/release-0.2/`

The root URL (`https://platform-mesh.github.io/`) might show a directory listing or 404 unless you add an index.html there.

## 7. View Deployment History

You can see all deployments in the Actions history:

1. Go to **Actions** tab
2. Filter by workflow: "pages"
3. See history of all deployments
4. Click any run to see:
   - Which branch triggered it
   - What version was built
   - Deployment success/failure
   - Full logs

## 8. Manual Verification Checklist

Use this checklist after each deployment:

**Main Version (`/main/`):**
- [ ] Homepage loads
- [ ] Navigation works (Home, Overview, Scenarios)
- [ ] Version dropdown appears
- [ ] Version dropdown shows all versions
- [ ] Styling is correct
- [ ] Images load
- [ ] Links work correctly
- [ ] Search works

**Release Version (`/release-0.2/`):**
- [ ] Homepage loads
- [ ] Navigation works
- [ ] Version dropdown appears
- [ ] Version dropdown shows all versions
- [ ] Content matches expected release version

**Version Switching:**
- [ ] Can switch from main to release
- [ ] Can switch from release to main
- [ ] Current page path is preserved when switching
- [ ] No 404 errors when switching

**PR Previews:**
- [ ] PR triggers workflow
- [ ] Bot comments with preview URL
- [ ] Preview URL loads correctly
- [ ] Shows PR changes
- [ ] Independent from version deployments

## 9. Debugging Commands

If something isn't working, use these commands:

**Check deployed content on gh-pages:**
```bash
# Clone just the gh-pages branch
git clone -b gh-pages https://github.com/platform-mesh/platform-mesh.github.io.git gh-pages-check
cd gh-pages-check
ls -la
# Should see: main/, release-0.2/, pr-preview/, etc.
```

**Check recent commits on gh-pages:**
```bash
git fetch origin gh-pages
git log origin/gh-pages --oneline -10
# Shows recent deployments
```

**Compare two versions:**
```bash
git checkout gh-pages
diff -r main/ release-0.2/
# Shows differences between versions
```

**Check file sizes:**
```bash
git checkout gh-pages
du -sh main/ release-0.2/
# Both should be similar size (a few MB)
```

## 10. Success Indicators

Your deployment is successful when:

✅ **Workflow Status:**
- All workflows complete with green checkmarks
- No errors in logs
- "Deploy to GitHub Pages" step succeeds

✅ **Branch Structure:**
- `gh-pages` branch exists
- Contains `main/` directory
- Contains `release-X.Y/` directories (if created)
- Each directory has `index.html` and `assets/`

✅ **URLs Work:**
- `https://platform-mesh.github.io/main/` → loads correctly
- `https://platform-mesh.github.io/release-0.2/` → loads correctly
- No 404 errors

✅ **Functionality Works:**
- Version selector appears
- Version switching works
- All navigation links work
- Images and assets load
- Search functionality works

✅ **PR Previews Work:**
- PRs trigger deployments
- Preview URLs load correctly
- Independent from version deployments

## Summary

The deployment creates this structure on the `gh-pages` branch:

```
gh-pages/
├── main/              ← Main branch deployment
│   ├── index.html
│   └── assets/
├── release-0.2/       ← Release branch deployment
│   ├── index.html
│   └── assets/
└── pr-preview/        ← PR preview deployments
    └── pr-123/
```

Each directory is independently deployed and served by GitHub Pages at its corresponding URL path.

**The `target-folder` parameter in the workflow is what creates these subdirectories automatically!**
