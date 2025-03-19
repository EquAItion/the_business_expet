# Deployment Guide for ExpertiseStation

## Prerequisites
- A Linux server with SSH access
- Node.js (v16 or higher) installed on the server
- MySQL server installed and configured
- Domain name (optional but recommended)

## Server Setup

1. Connect to your server via SSH:
```bash
ssh username@your-server-ip
```

2. Create project directory:
```bash
mkdir -p /var/www/expertisestation
cd /var/www/expertisestation
```

3. Clone the repository:
```bash
git clone <your-repository-url> .
```

## Environment Configuration

1. Configure frontend environment:
- Copy the production environment variables
- Update API endpoints to match your domain

2. Configure backend environment:
- Copy `.env.production` to `.env`
- Update database credentials and connection details
- Set `NODE_ENV=production`

## Database Setup

1. Create MySQL database and user:
```sql
CREATE DATABASE your_database_name;
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

2. Import database schema:
```bash
mysql -u your_username -p your_database_name < src/database/schema.sql
```

## Application Deployment

1. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd src/server
npm install
```

2. Build frontend:
```bash
npm run build
```

3. Setup PM2 for backend:
```bash
npm install -g pm2
pm2 start src/server/server.js --name expertisestation
pm2 startup
```

## Nginx Configuration

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/expertisestation/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable configuration:
```bash
sudo ln -s /etc/nginx/sites-available/expertisestation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Configuration (Optional)

1. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Maintenance

- Monitor logs: `pm2 logs expertisestation`
- Restart application: `pm2 restart expertisestation`
- View status: `pm2 status`

## Troubleshooting

1. Check application logs:
```bash
pm2 logs expertisestation
```

2. Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Check server status:
```bash
systemctl status nginx
pm2 status
```