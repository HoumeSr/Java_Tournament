
@REM ALERT: При существовании БД она будет пересоздана этим скриптом
@REM setup_db.bat localhost 5432 postgres postgres
@echo off
setlocal enabledelayedexpansion

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
    echo ERROR: psql not found in PATH.
    echo Add PostgreSQL bin folder to PATH.
    exit /b 1
)

echo Host: %PGHOST%
echo Port: %PGPORT%
echo User: %PGUSER%
echo Configuring PostgreSQL...

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" >nul 2>&1

for /f "tokens=*" %%i in ('psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname='%PGDBNAME%';" 2^>nul') do set DB_EXISTS=%%i

if "%DB_EXISTS%"=="1" (
    echo Database %PGDBNAME% exists. Dropping it...

    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%PGDBNAME%' AND pid <> pg_backend_pid();" >nul 2>&1

    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "DROP DATABASE %PGDBNAME%;"
    if errorlevel 1 (
        echo ERROR: Failed to drop database %PGDBNAME%.
        exit /b 1
    )
    echo Database %PGDBNAME% dropped.
)

echo Creating database %PGDBNAME%...
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE %PGDBNAME%;"
if errorlevel 1 (
    echo ERROR: Failed to create database %PGDBNAME%.
    exit /b 1
)

echo Done.
echo Database: %PGDBNAME%
echo User: %PGUSER%

endlocal