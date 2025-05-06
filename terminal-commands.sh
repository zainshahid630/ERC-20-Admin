# 1. Configure Git with your personal email and name
git config --global user.email "zainshahid630@gmail.com"
git config --global user.name "Zain Shahid"

# 2. Verify the configuration
git config --global user.email
git config --global user.name

# 3. Initialize git repository (if not already done)
git init

# 4. Add the remote repository using HTTPS URL
git remote add origin https://github.com/zainshahid630/ERC-20-Admin.git

# 5. Add all files to staging
git add .

# 6. Commit your changes
git commit -m "Initial commit: ERC-20 Admin Panel implementation"

# 7. Push to GitHub (using main branch)
git branch -M main
git push -u origin main
