# New API

A powerful API management and proxy service with Discord bot integration.

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- A Discord bot token (if using Discord integration)

### Installation Steps

1. Create a new directory for your deployment:
```bash
mkdir new-api && cd new-api
```

2. Download the configuration files:
```bash
# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/LiveGamer101/new-api/main/docker-compose.yml

# Download environment template
curl -O https://raw.githubusercontent.com/LiveGamer101/new-api/main/.env.example
```

3. Create your environment file:
```bash
# Copy the example file to .env
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

4. Create required directories:
```bash
mkdir -p data logs
```

5. Start the services:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### Default Credentials
- Username: root
- Password: 123456

**Important:** Change the default password after first login!

### Discord Bot Setup (Optional)

1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot and get your bot token
3. Add the bot to your server using the OAuth2 URL generator (required permissions: bot, applications.commands)
4. Update your .env file with:
   - DISCORD_BOT_TOKEN: Your bot token
   - DISCORD_ADMIN_IDS: Your Discord user ID
   - DISCORD_GUILD_ID: Your server ID

### Environment Variables

Key environment variables you might want to configure:

#### Essential Settings
- `MYSQL_ROOT_PASSWORD`: Database root password
- `SESSION_SECRET`: Random string for session encryption
- `TZ`: Your timezone (e.g., UTC, Asia/Shanghai)

#### Discord Integration
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_ADMIN_IDS`: Comma-separated list of admin user IDs
- `DISCORD_GUILD_ID`: Your Discord server ID

#### Security
- `TURNSTILE_CHECK_ENABLED`: Enable Cloudflare Turnstile protection
- `TURNSTILE_SITE_KEY`: Turnstile site key
- `TURNSTILE_SECRET_KEY`: Turnstile secret key

#### Email (Optional)
- `SMTP_SERVER`: SMTP server address
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_ACCOUNT`: SMTP account
- `SMTP_TOKEN`: SMTP password/token

### Directory Structure

```
new-api/
├── docker-compose.yml    # Docker Compose configuration
├── .env                 # Environment configuration
├── data/               # Persistent data
└── logs/               # Application logs
```

### Maintenance

#### View Logs
```bash
docker-compose logs -f new-api
```

#### Update to Latest Version
```bash
docker-compose pull
docker-compose up -d
```

#### Backup Data
```bash
# Backup MySQL data
docker exec new-api-mysql mysqldump -u root -p new-api > backup.sql

# Backup application data
tar -czf data_backup.tar.gz data/
```

### Troubleshooting

1. If the application fails to start, check the logs:
```bash
docker-compose logs new-api
```

2. If you can't connect to the database:
- Verify MySQL is running: `docker-compose ps`
- Check MySQL logs: `docker-compose logs mysql`
- Verify database credentials in .env

3. If Discord bot commands don't work:
- Verify bot token and permissions
- Check if bot is in the server
- Verify admin user IDs are correct

### Security Recommendations

1. Change default passwords:
   - MySQL root password
   - Application admin password
   - Session secret

2. Enable Turnstile protection for login page

3. Use HTTPS in production:
   - Set up a reverse proxy (nginx/traefik)
   - Configure SSL certificates

4. Restrict network access:
   - Don't expose database ports
   - Use strong passwords
   - Enable firewall rules

### Support

For issues and feature requests, please visit our GitHub repository.
