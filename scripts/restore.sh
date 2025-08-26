#!/bin/bash

# Samsung Reflect AI Restore Script
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.tar.gz>"
    echo "Available backups:"
    ls -la backups/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="restore_$(date +%Y%m%d_%H%M%S)"

echo "🔄 Restoring from $BACKUP_FILE..."

# Extract backup
echo "📦 Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR" --strip-components=1

# Stop services
echo "⏹️ Stopping services..."
docker-compose down

# Restore MongoDB data
echo "📊 Restoring MongoDB data..."
if [ -d "$RESTORE_DIR/mongodb" ]; then
    docker-compose up -d mongodb
    sleep 5
    docker cp "$RESTORE_DIR/mongodb" $(docker-compose ps -q mongodb):/tmp/restore
    docker-compose exec -T mongodb mongorestore --drop /tmp/restore
fi

# Restore uploaded files
echo "📁 Restoring uploaded files..."
if [ -d "$RESTORE_DIR/uploads" ]; then
    rm -rf uploads
    cp -r "$RESTORE_DIR/uploads" .
fi

# Restore vector database
echo "🔍 Restoring vector database..."
if [ -d "$RESTORE_DIR/qdrant_storage" ]; then
    rm -rf qdrant_storage
    cp -r "$RESTORE_DIR/qdrant_storage" .
fi

# Restore configuration (with confirmation)
if [ -f "$RESTORE_DIR/.env" ]; then
    echo "⚙️ Found .env in backup. Replace current? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp "$RESTORE_DIR/.env" .
        echo "✅ Configuration restored"
    fi
fi

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Cleanup
rm -rf "$RESTORE_DIR"

echo "✅ Restore complete!"
echo "🔍 Check service health: docker-compose ps"
