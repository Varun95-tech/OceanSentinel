# Spring Boot + MySQL

The React app now proxies `/api` requests to Spring Boot on port `8080`.
The old Node JSON API remains available as `npm run server` if needed, but do not run both API servers on the same proxy target.

## Start MySQL

With Docker Desktop running:

```powershell
docker compose up -d mysql
```

This creates database `ocean_sentinel` with MySQL root password `root`.

## Start Spring Boot

Install Java 17+ and Maven, then from the project root:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "root"
mvn spring-boot:run
```

Spring Boot creates or updates the `incidents` table and seeds the four demo incidents when the table is empty.

## Start the frontend

In a second terminal:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal. The sidebar should show `API connected` when Spring Boot and MySQL are reachable.

## Configuration

The backend reads these environment variables:

- `DB_URL`, default `jdbc:mysql://localhost:3306/ocean_sentinel?createDatabaseIfNotExist=true&serverTimezone=UTC`
- `DB_USERNAME`, default `root`
- `DB_PASSWORD`, default empty
- `PORT`, default `8080`
