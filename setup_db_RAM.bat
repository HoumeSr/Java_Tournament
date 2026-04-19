@REM ALERT: При существовании БД она будет пересоздана этим скриптом
@echo off
setlocal enabledelayedexpansion

REM Путь к PostgreSQL
set PG_PATH=C:\Program Files\PostgreSQL\17\bin
set PATH=%PG_PATH%;%PATH%

set PGHOST=%1
set PGPORT=%2
set PGUSER=%3
set PGPASSWORD=%4

if "%PGHOST%"=="" set PGHOST=localhost
if "%PGPORT%"=="" set PGPORT=5432
if "%PGUSER%"=="" set PGUSER=postgres
if "%PGPASSWORD%"=="" set PGPASSWORD=postgres

set PGDBNAME=tournament_db

where psql >nul 2>nul
if errorlevel 1 (
    echo ERROR: psql not found at %PG_PATH%
    exit /b 1
)

echo Host: %PGHOST%
echo Port: %PGPORT%
echo User: %PGUSER%
echo Configuring PostgreSQL...

for /f "tokens=*" %%i in ('psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname='%PGDBNAME%';" 2^>nul') do set DB_EXISTS=%%i

if "%DB_EXISTS%"=="1" (
    echo Database %PGDBNAME% exists. Dropping it...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%PGDBNAME%' AND pid <> pg_backend_pid();" >nul 2>&1
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "DROP DATABASE %PGDBNAME%;"
    echo Database %PGDBNAME% dropped.
)

echo Creating database %PGDBNAME%...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE %PGDBNAME%;"

echo Creating table "user"...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDBNAME% -c "CREATE TABLE IF NOT EXISTS \"user\" (id BIGSERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role VARCHAR(255) NOT NULL DEFAULT 'PLAYER', enabled BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);"

echo Done.
echo Database: %PGDBNAME%
echo Table "user" created successfully!

endlocal