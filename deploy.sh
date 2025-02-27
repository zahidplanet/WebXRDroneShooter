#!/bin/bash

# Configuration
APP_NAME="ar-cade"
SOURCE_DIR="arcade-platform"
DEPLOY_DIR="dist"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing to deploy AR-Cade Platform...${NC}"

# Create dist directory if it doesn't exist
mkdir -p "$DEPLOY_DIR"

# Clean previous build
echo "Cleaning previous build..."
rm -rf "$DEPLOY_DIR"/*

# Copy all files to the dist directory
echo "Copying files to distribution directory..."
cp -R "$SOURCE_DIR"/* "$DEPLOY_DIR"/

# Create robots.txt
echo "Creating robots.txt..."
cat > "$DEPLOY_DIR/robots.txt" <<EOL
User-agent: *
Allow: /
EOL

# Create .htaccess for Apache servers
echo "Creating .htaccess file..."
cat > "$DEPLOY_DIR/.htaccess" <<EOL
# Enable CORS
Header set Access-Control-Allow-Origin "*"

# Set MIME types
AddType application/json .json
AddType application/manifest+json .webmanifest

# Cache control
<FilesMatch "\.(html|htm)$">
  Header set Cache-Control "max-age=0, public, must-revalidate"
</FilesMatch>

<FilesMatch "\.(js|css|json|webmanifest)$">
  Header set Cache-Control "max-age=604800, public"
</FilesMatch>

<FilesMatch "\.(jpg|jpeg|png|gif|ico|svg)$">
  Header set Cache-Control "max-age=2592000, public"
</FilesMatch>

# Performance
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle 404 errors
ErrorDocument 404 /index.html
EOL

echo -e "${GREEN}Deployment files prepared successfully!${NC}"
echo -e "To deploy the application:"
echo -e "1. Upload the contents of the '${DEPLOY_DIR}' directory to your web server"
echo -e "2. Ensure your web server is configured to serve HTTPS"
echo -e "3. For GitHub Pages deployment, consider using 'gh-pages' branch"
echo -e "4. For other platforms like Netlify or Vercel, link your repository and configure build settings"

echo -e "\n${YELLOW}Remember:${NC} WebXR and camera access require HTTPS to function properly." 