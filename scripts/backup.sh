#!/bin/bash

# Samsung Reflect AI Backup Script
set -e

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup in $BACKUP_DIR..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB data
echo "📊 Backing up MongoDB data..."
docker-compose exec -T mongodb mongodump --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup "$BACKUP_DIR/mongodb"

# Backup uploaded files
echo "📁 Backing up uploaded files..."
if [ -d "uploads" ]; then
    cp -r uploads "$BACKUP_DIR/"
fi

# Backup vector database
echo "🔍 Backing up vector database..."
if [ -d "qdrant_storage" ]; then
    cp -r qdrant_storage "$BACKUP_DIR/"
fi

# Backup configuration
echo "⚙️ Backing up configuration..."
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "No .env file found"
cp config/ranking.json "$BACKUP_DIR/" 2>/dev/null || echo "No ranking config found"

# Create backup info
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Samsung Reflect AI Backup
Created: $(date)
Version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Services: $(docker-compose ps --services | tr '\n' ' ')
EOF

# Compress backup
echo "🗜️ Compressing backup..."
tar -czf "${BACKUP_DIR}.tar.gz" -C backups "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "✅ Backup complete: ${BACKUP_DIR}.tar.gz"
echo "📊 Size: $(du -sh ${BACKUP_DIR}.tar.gz | cut -f1)"
