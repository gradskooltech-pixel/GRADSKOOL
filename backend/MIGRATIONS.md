# GRADSKOOL — Migrations Guide

## First-Time Setup

The `apps/accounts/migrations/0001_initial.py` is a hand-authored
bootstrap migration so the project structure is complete.

**For actual deployment, replace it with auto-generated migrations:**

```bash
# 1. Set up your environment
cp .env.example .env
# Fill in DATABASE_URL and other required vars

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate all migrations fresh (recommended)
python manage.py makemigrations accounts
python manage.py makemigrations courses
python manage.py makemigrations enrollments
python manage.py makemigrations payments
python manage.py makemigrations content
python manage.py makemigrations tools
python manage.py makemigrations blog
python manage.py makemigrations leads
python manage.py makemigrations notifications
# dashboard has no models — skip

# 4. Apply migrations
python manage.py migrate

# 5. Seed data (in this order — dependencies matter)
python manage.py seed_courses     # Exams, pricing plans, instructor
python manage.py seed_tools       # Tools, tag taxonomy, QA topics, vocab sample
python manage.py seed_leads       # 7 drip sequences with email copy

# 6. Create superuser
python manage.py createsuperuser

# 7. Run dev server
python manage.py runserver
```

## Migration Order

The apps have these foreign key dependencies:

```
accounts  ← (no deps)
courses   ← accounts (Course.instructor FK)
enrollments ← accounts, courses
payments    ← accounts, courses, enrollments
content     ← accounts, courses
tools       ← (no app deps — uses tags)
blog        ← accounts (author FK), courses (exam FK)
leads       ← accounts (user FK implied via signals)
notifications ← accounts, enrollments, payments, content
dashboard   ← (views only, no models)
```

Django handles this automatically with `makemigrations`.
Just run all `makemigrations` commands then `migrate` once.

## After Model Changes

```bash
python manage.py makemigrations <app_name>
python manage.py migrate
```

## Railway (Production)

Migrations run automatically via `railway.toml`:
```toml
buildCommand = "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput"
```

Seed commands must be run manually after first deploy:
```bash
railway run python manage.py seed_courses
railway run python manage.py seed_tools
railway run python manage.py seed_leads
```
