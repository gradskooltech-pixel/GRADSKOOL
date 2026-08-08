#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GRADSKOOL — Complete Backend Setup Script
# Run this once after cloning / extracting the zip.
#
# Usage:
#   cd backend
#   chmod +x setup.sh
#   ./setup.sh
#
# What it does:
#   1. Creates virtual environment
#   2. Installs dependencies
#   3. Creates .env from template
#   4. Runs all migrations
#   5. Seeds all exam data
#   6. Seeds all tool metadata
#   7. Imports all tool question banks from HTML files
#   8. Seeds email drip sequences
#   9. Prompts to create superuser
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       GRADSKOOL Backend Setup                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Step 1: Virtual environment ──────────────────────────────────
echo "▶  Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate
echo "   ✓ venv activated"

# ── Step 2: Install dependencies ─────────────────────────────────
echo ""
echo "▶  Installing dependencies..."
pip install -r requirements.txt --quiet
echo "   ✓ Dependencies installed"

# ── Step 3: Create .env ──────────────────────────────────────────
if [ ! -f .env ]; then
    echo ""
    echo "▶  Creating .env file..."
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(50))")
    cat > .env << ENVEOF
# ── CORE ──────────────────────────────────────────────────────────
SECRET_KEY=${SECRET_KEY}
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# ── DATABASE ──────────────────────────────────────────────────────
# Leave blank to use SQLite (fine for local dev)
# DATABASE_URL=postgresql://user:pass@host:5432/dbname

# ── PAYMENTS ──────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_SU7dI6nEFZHORN
# RAZORPAY_KEY_SECRET=your-secret-here

# ── EMAIL ─────────────────────────────────────────────────────────
# RESEND_API_KEY=re_your-key-here
FROM_EMAIL=noreply@gradskool.in

# ── CDN ───────────────────────────────────────────────────────────
# BUNNY_STORAGE_ZONE=gradskool
# BUNNY_STORAGE_KEY=your-key
# BUNNY_CDN_URL=https://gradskool.b-cdn.net

# ── FRONTEND ──────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
ENVEOF
    echo "   ✓ .env created with auto-generated SECRET_KEY"
else
    echo ""
    echo "   ℹ  .env already exists — skipping"
fi

# ── Step 4: Migrations ───────────────────────────────────────────
echo ""
echo "▶  Running migrations..."
python manage.py makemigrations accounts courses enrollments payments content tools blog leads notifications learn dashboard 2>&1 | grep -v "^No changes"
python manage.py migrate --run-syncdb
echo "   ✓ Database ready"

# ── Step 5: Seed exam data ───────────────────────────────────────
echo ""
echo "▶  Seeding exam data (13 exams)..."
python manage.py seed_courses
echo "   ✓ Exams seeded"

# ── Step 6: Seed tool metadata ───────────────────────────────────
echo ""
echo "▶  Seeding tool metadata..."
python manage.py seed_tools
echo "   ✓ Tool metadata seeded"

# ── Step 7: Import tool question banks ──────────────────────────
echo ""
echo "▶  Importing tool question banks from HTML files..."
echo "   (RC passages, CAT Maths questions, GRE vocab, Grammar, GK, Reasoning, Legal)"
python manage.py import_from_html --html-dir ./tool_html
echo "   ✓ Tool question banks imported"

# ── Step 8: Seed leads/drip ──────────────────────────────────────
echo ""
echo "▶  Seeding email drip sequences..."
python manage.py seed_leads
echo "   ✓ Drip sequences seeded"

# ── Step 9: Superuser ────────────────────────────────────────────
echo ""
echo "▶  Creating admin superuser..."
echo "   (This is the account you'll use to log into /admin-panel)"
python manage.py createsuperuser

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✓ Setup complete! Start the server with:   ║"
echo "║                                              ║"
echo "║     python manage.py runserver               ║"
echo "║                                              ║"
echo "║   Backend: http://localhost:8000             ║"
echo "║   Admin:   http://localhost:8000/admin       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
