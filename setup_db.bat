@REM setup_db.bat localhost 5432 postgres postgres


@echo off
setlocal

set PGHOST=%1
set PGPORT=%2
set PGUSER=%3
set PGPASSWORD=%4

if "%PGHOST%"=="" set PGHOST=localhost
if "%PGPORT%"=="" set PGPORT=5432
if "%PGUSER%"=="" set PGUSER=postgres
if "%PGPASSWORD%"=="" set PGPASSWORD=postgres


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

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
if errorlevel 1 (
    echo ERROR: Failed to alter postgres user password.
    exit /b 1
)

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname='tournament_db';" > temp_db_check.txt
set /p DB_EXISTS=<temp_db_check.txt
del temp_db_check.txt

if not "%DB_EXISTS%"=="1" (
    echo Creating database tournament_db...
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE tournament_db;"
    if errorlevel 1 (
        echo ERROR: Failed to create database tournament_db.
        exit /b 1
    )
) else (
    echo Database tournament_db already exists.
)
echo Done.
echo Database: tournament_db
echo User: postgres
echo Password: postgres

endlocal
pause
